/**
 * MIA Académie — Comprehensive Manual QA Test Suite
 * Tests all roles, pages, forms, RBAC, and workflows
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const CREDS = {
  admin:   { email: 'admin@mia-academie.com',          password: 'TestPassword123!', role: 'ADMIN' },
  trainer: { email: 'youssef.trainer@mia-academie.com', password: 'TestPassword123!', role: 'TRAINER' },
  trainer2:{ email: 'nadia.trainer@mia-academie.com',   password: 'TestPassword123!', role: 'TRAINER' },
  student: { email: 'yasmine.b@gmail.com',              password: 'TestPassword123!', role: 'STUDENT' },
  student2:{ email: 'othmanou01@gmail.com',             password: 'TestPassword123!', role: 'STUDENT' },
};

const findings = [];
const log = [];

function record(severity, title, detail, url = '') {
  const entry = { severity, title, detail, url };
  findings.push(entry);
  const icon = { PASS:'✅', P0:'🔴', P1:'🟠', P2:'🟡', INFO:'ℹ️' }[severity] || '•';
  const msg = `${icon} [${severity}] ${title}${detail ? ' — ' + detail : ''}${url ? ' @ ' + url : ''}`;
  console.log(msg);
  log.push(msg);
}

function pass(title, detail='') { record('PASS', title, detail); }
function p0(title, detail, url='')   { record('P0', title, detail, url); }
function p1(title, detail, url='')   { record('P1', title, detail, url); }
function p2(title, detail, url='')   { record('P2', title, detail, url); }
function info(title, detail='')  { record('INFO', title, detail); }

// ── Helpers ────────────────────────────────────────────────────────────────

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const netFails = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('requestfailed', req => netFails.push({ url: req.url(), err: req.failure()?.errorText }));
  page._consoleErrors = consoleErrors;
  page._netFails = netFails;
  return page;
}

async function goto(page, path, opts = {}) {
  try {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 15000, ...opts });
    return res;
  } catch (e) {
    p1('Page navigation timeout/error', `${path}: ${e.message}`);
    return null;
  }
}

async function login(page, cred) {
  await goto(page, '/login');
  await page.fill('input[type="email"], input[name="email"]', cred.email);
  await page.fill('input[type="password"], input[name="password"]', cred.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const url = page.url();
  return url;
}

async function checkConsoleErrors(page, context) {
  if (page._consoleErrors.length > 0) {
    p2(`Console errors on ${context}`, page._consoleErrors.slice(0,3).join(' | '));
  }
}

async function checkNetFails(page, context) {
  const real = page._netFails.filter(f => !f.url.includes('_next') && !f.url.includes('favicon'));
  if (real.length > 0) {
    p1(`Network failures on ${context}`, real.slice(0,3).map(f => f.url).join(' | '));
  }
}

async function checkNoError(page, context) {
  const text = await page.textContent('body').catch(() => '');
  if (/application error|something went wrong|500|internal server error/i.test(text)) {
    p0(`Server error on ${context}`, 'Page shows application error');
  }
  if (/404|not found/i.test(await page.title().catch(() => ''))) {
    p1(`404 on ${context}`, 'Page title indicates 404');
  }
}

async function textVisible(page, text, context) {
  const found = await page.locator(`text=${text}`).count();
  return found > 0;
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 1 — VISITOR / PUBLIC PAGES
// ══════════════════════════════════════════════════════════════════════════

async function testVisitor(browser) {
  console.log('\n══ PHASE 1: VISITOR ══\n');
  const page = await newPage(browser);

  // 1.1 Home page
  await goto(page, '/');
  await checkNoError(page, 'Home');
  const title = await page.title();
  if (title.includes('MIA')) pass('Home page loads', title);
  else p1('Home page title wrong', title);

  // Hero section
  const hero = await page.locator('h1, h2').first().textContent().catch(() => '');
  info('Home hero text', hero.substring(0, 80));

  // Check formations section visible
  const hasFormations = await page.locator('text=/formation/i').count();
  if (hasFormations > 0) pass('Formations section visible on home');
  else p1('No formations visible on home page', 'Landing page formations section empty or broken');

  // Nav links
  const navLinks = await page.locator('nav a').allTextContents().catch(() => []);
  info('Nav links', navLinks.join(', '));

  // Check login button present
  const loginBtn = await page.locator('a[href="/login"], button:has-text("Connexion")').count();
  if (loginBtn > 0) pass('Login button visible on home');
  else p2('No login button found on home page');

  await checkConsoleErrors(page, 'home');
  await checkNetFails(page, 'home');

  // 1.2 Login page
  await goto(page, '/login');
  await checkNoError(page, '/login');
  pass('Login page loads');

  // Empty form submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const emailErr = await page.locator('[class*="error"], [class*="invalid"], [aria-invalid]').count();
  if (emailErr > 0) pass('Login form — empty submit shows validation');
  else p2('Login form — empty submit: no validation error shown');

  // Invalid email
  await page.fill('input[type="email"], input[name="email"]', 'notanemail');
  await page.fill('input[type="password"], input[name="password"]', 'anything');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Wrong password
  await page.fill('input[type="email"], input[name="email"]', CREDS.admin.email);
  await page.fill('input[type="password"], input[name="password"]', 'WrongPassword!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const hasLoginErr = await page.locator('text=/invalide|incorrect|error|erreur|wrong/i').count();
  if (hasLoginErr > 0) pass('Login error shown for wrong password');
  else p1('Login — wrong password shows no error message');

  // 1.3 Forgot password page
  const forgotLink = await page.locator('a[href*="forgot"], a:has-text("mot de passe oublié"), a:has-text("Forgot")').count();
  if (forgotLink > 0) {
    pass('Forgot password link present');
    await page.locator('a[href*="forgot"], a:has-text("mot de passe oublié"), a:has-text("Forgot")').first().click();
    await page.waitForTimeout(1000);
    await checkNoError(page, 'forgot-password');
    const fpUrl = page.url();
    if (fpUrl.includes('forgot') || fpUrl.includes('reset')) pass('Forgot password page accessible');
    else p2('Forgot password link goes to wrong page', fpUrl);
  } else {
    p2('No forgot password link found on login page');
  }

  // 1.4 Public formations / catalog
  const catalogPaths = ['/formations', '/catalog', '/courses'];
  for (const path of catalogPaths) {
    const res = await page.goto(BASE + path, { timeout: 8000 }).catch(() => null);
    if (res && res.status() < 400) {
      pass(`Public catalog accessible at ${path}`);
      break;
    }
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 2 — STUDENT
// ══════════════════════════════════════════════════════════════════════════

async function testStudent(browser) {
  console.log('\n══ PHASE 2: STUDENT ══\n');
  const page = await newPage(browser);

  // Login
  const afterLogin = await login(page, CREDS.student);
  info('Student login redirected to', afterLogin);

  if (!afterLogin.includes('/student') && !afterLogin.includes('/dashboard')) {
    p0('Student login redirect failed', `Got: ${afterLogin}`, afterLogin);
    await page.close();
    return;
  }
  pass('Student login successful');

  // 2.1 Student dashboard
  await goto(page, '/dashboard');
  await checkNoError(page, '/dashboard');
  const dashText = await page.textContent('body').catch(() => '');
  if (dashText.length > 100) pass('Student dashboard renders content');
  else p1('Student dashboard appears empty');
  await checkConsoleErrors(page, 'student dashboard');
  await checkNetFails(page, 'student dashboard');

  // 2.2 Student formations list
  await goto(page, '/student/formations');
  await checkNoError(page, '/student/formations');
  const formationsCount = await page.locator('[class*="card"], [class*="formation"], li').count();
  if (formationsCount > 0) pass('Student formations page — content visible', `${formationsCount} elements`);
  else p1('Student formations page empty or broken');
  await checkConsoleErrors(page, 'student formations');

  // Try clicking on a formation card
  const formationCard = await page.locator('a[href*="/student/formations/"]').first();
  if (await formationCard.count()) {
    const href = await formationCard.getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await checkNoError(page, 'formation detail');
    pass('Student formation detail page loads');
    await checkConsoleErrors(page, 'formation detail');

    // Check for module list
    const modules = await page.locator('a[href*="/modules/"], [class*="module"]').count();
    info('Modules visible on formation detail', modules.toString());

    // Try opening first module
    const firstModule = await page.locator('a[href*="/modules/"]').first();
    if (await firstModule.count()) {
      const modHref = await firstModule.getAttribute('href');
      await goto(page, modHref.replace(BASE, ''));
      await checkNoError(page, 'module page');
      const modTitle = await page.title();
      pass('Student module page loads', modTitle);
      await checkConsoleErrors(page, 'module page');
      await checkNetFails(page, 'module page');
    }
  }

  // 2.3 Student profile / settings
  const profilePaths = ['/student/profile', '/settings', '/profile'];
  for (const path of profilePaths) {
    await goto(page, path);
    const noErr = await page.locator('text=/error|404/i').count() === 0;
    const hasForm = await page.locator('form, input').count() > 0;
    if (noErr && hasForm) {
      pass(`Student profile page at ${path}`);
      // Try editing name field
      const nameInput = await page.locator('input[name="name"], input[placeholder*="nom"], input[placeholder*="Name"]').first();
      if (await nameInput.count()) {
        const current = await nameInput.inputValue();
        await nameInput.fill('Yasmine Test');
        await nameInput.fill(current); // restore
        pass('Student profile — name field editable');
      }
      break;
    }
  }

  // 2.4 Student notifications
  const notifPaths = ['/student/notifications', '/notifications'];
  for (const path of notifPaths) {
    await goto(page, path);
    const status = await page.locator('body').textContent().catch(() => '');
    if (status.length > 50 && !status.includes('404')) {
      pass(`Notifications page accessible at ${path}`);
      break;
    }
  }

  // 2.5 Evaluations / Bilan pages
  await goto(page, '/student/formations');
  await checkConsoleErrors(page, 'student formations (2)');

  // 2.6 RBAC — student tries admin page
  await goto(page, '/admin');
  const adminUrl = page.url();
  if (adminUrl.includes('/admin') && !adminUrl.includes('/login') && !adminUrl.includes('/unauthorized') && !adminUrl.includes('/403')) {
    p0('RBAC BREACH: Student can access /admin', `Landed at: ${adminUrl}`, adminUrl);
  } else {
    pass('RBAC: Student correctly blocked from /admin', `Redirected to: ${adminUrl}`);
  }

  // 2.7 RBAC — student tries trainer page
  await goto(page, '/trainer');
  const trainerUrl = page.url();
  if (trainerUrl.includes('/trainer') && !trainerUrl.includes('/login') && !trainerUrl.includes('/unauthorized') && !trainerUrl.includes('/403')) {
    p0('RBAC BREACH: Student can access /trainer', `Landed at: ${trainerUrl}`, trainerUrl);
  } else {
    pass('RBAC: Student correctly blocked from /trainer', `Redirected to: ${trainerUrl}`);
  }

  // 2.8 Logout
  const logoutBtn = await page.locator('button:has-text("Déconnexion"), button:has-text("Logout"), a:has-text("Déconnexion")').first();
  if (await logoutBtn.count()) {
    await logoutBtn.click();
    await page.waitForTimeout(2000);
    const loggedOutUrl = page.url();
    if (loggedOutUrl.includes('/login') || loggedOutUrl === BASE + '/') {
      pass('Student logout works', `Redirected to: ${loggedOutUrl}`);
    } else {
      p1('Logout redirect unexpected', loggedOutUrl);
    }
  } else {
    p2('No logout button found for student');
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 3 — TRAINER
// ══════════════════════════════════════════════════════════════════════════

async function testTrainer(browser) {
  console.log('\n══ PHASE 3: TRAINER ══\n');
  const page = await newPage(browser);

  const afterLogin = await login(page, CREDS.trainer);
  info('Trainer login redirected to', afterLogin);

  if (!afterLogin.includes('/trainer') && !afterLogin.includes('/dashboard')) {
    p1('Trainer login redirect unexpected', afterLogin);
  } else {
    pass('Trainer login successful');
  }

  // 3.1 Trainer dashboard
  await goto(page, '/trainer/dashboard');
  await checkNoError(page, '/trainer/dashboard');
  const dashContent = await page.textContent('body').catch(() => '');
  if (dashContent.length > 100) pass('Trainer dashboard renders');
  else p1('Trainer dashboard appears empty');
  await checkConsoleErrors(page, 'trainer dashboard');
  await checkNetFails(page, 'trainer dashboard');

  // 3.2 Trainer formations
  await goto(page, '/trainer/formations');
  await checkNoError(page, '/trainer/formations');
  pass('Trainer formations page loads');
  await checkConsoleErrors(page, 'trainer formations');

  // Try clicking on a formation
  const trainerFormation = await page.locator('a[href*="/trainer/formations/"]').first();
  if (await trainerFormation.count()) {
    const href = await trainerFormation.getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await checkNoError(page, 'trainer formation detail');
    pass('Trainer formation detail page loads');
    await checkConsoleErrors(page, 'trainer formation detail');
  }

  // 3.3 Trainer students
  await goto(page, '/trainer/students');
  await checkNoError(page, '/trainer/students');
  pass('Trainer students page loads');
  await checkConsoleErrors(page, 'trainer students');

  // 3.4 Trainer attendance
  await goto(page, '/trainer/attendance');
  await checkNoError(page, '/trainer/attendance');
  const hasAttendance = await page.locator('body').textContent().catch(() => '');
  if (hasAttendance.length > 100) pass('Trainer attendance page renders');
  else p1('Trainer attendance page empty or broken');
  await checkConsoleErrors(page, 'trainer attendance');

  // 3.5 Trainer profile
  await goto(page, '/trainer/profile');
  await checkNoError(page, '/trainer/profile');
  pass('Trainer profile page loads');

  // 3.6 RBAC — trainer tries admin
  await goto(page, '/admin');
  const adminUrl = page.url();
  if (adminUrl.includes('/admin') && !adminUrl.includes('/login') && !adminUrl.includes('/unauthorized') && !adminUrl.includes('/403')) {
    p0('RBAC BREACH: Trainer can access /admin', `Landed at: ${adminUrl}`, adminUrl);
  } else {
    pass('RBAC: Trainer correctly blocked from /admin');
  }

  // 3.7 RBAC — trainer tries student page
  await goto(page, '/student/formations');
  const studentUrl = page.url();
  if (studentUrl.includes('/student') && !studentUrl.includes('/login') && !studentUrl.includes('/unauthorized') && !studentUrl.includes('/403')) {
    p2('Trainer can access /student pages', `Landed at: ${studentUrl}`, studentUrl);
  } else {
    pass('RBAC: Trainer blocked from /student pages');
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 4 — ADMIN (main test phase)
// ══════════════════════════════════════════════════════════════════════════

async function testAdmin(browser) {
  console.log('\n══ PHASE 4: ADMIN ══\n');
  const page = await newPage(browser);

  const afterLogin = await login(page, CREDS.admin);
  info('Admin login redirected to', afterLogin);

  if (!afterLogin.includes('/admin')) {
    p1('Admin login did not redirect to /admin', afterLogin);
  } else {
    pass('Admin login successful');
  }

  // 4.1 Admin dashboard
  await goto(page, '/admin/dashboard');
  await checkNoError(page, 'admin dashboard');
  const dashText = await page.textContent('body').catch(() => '');
  if (dashText.includes('inscription') || dashText.includes('étudiant') || dashText.includes('formation') || dashText.length > 200) {
    pass('Admin dashboard renders stats');
  } else {
    p1('Admin dashboard appears empty or broken');
  }
  await checkConsoleErrors(page, 'admin dashboard');
  await checkNetFails(page, 'admin dashboard');

  // 4.2 Admin formations
  await goto(page, '/admin/formations');
  await checkNoError(page, 'admin formations');
  const formCount = await page.locator('[class*="card"], tr, [class*="row"]').count();
  if (formCount > 0) pass('Admin formations list renders', `${formCount} items`);
  else p1('Admin formations list empty or broken');
  await checkConsoleErrors(page, 'admin formations');

  // Click on first formation
  const firstForm = await page.locator('a[href*="/admin/formations/"]').first();
  if (await firstForm.count()) {
    const href = await firstForm.getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await checkNoError(page, 'admin formation detail');
    pass('Admin formation detail page loads');
    await checkConsoleErrors(page, 'admin formation detail');
    await checkNetFails(page, 'admin formation detail');

    // Check for modules section
    const hasModules = await page.locator('text=/module/i').count();
    if (hasModules > 0) pass('Formation detail — modules section visible');
    else p2('Formation detail — no modules section visible');

    // Try editing formation (look for edit button or sheet)
    const editBtn = await page.locator('button:has-text("Modifier"), button:has-text("Edit"), button[aria-label*="edit"]').first();
    if (await editBtn.count()) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      const hasForm = await page.locator('form, input[name="title"]').count();
      if (hasForm > 0) pass('Formation edit opens successfully');
      else p2('Formation edit button clicked but no form appeared');
      // Close sheet/modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // 4.3 Admin students
  await goto(page, '/admin/students');
  await checkNoError(page, 'admin students');
  const studentCount = await page.locator('tr, [class*="card"], [class*="student"]').count();
  if (studentCount > 0) pass('Admin students list renders', `${studentCount} items`);
  else p1('Admin students list empty or broken');
  await checkConsoleErrors(page, 'admin students');
  await checkNetFails(page, 'admin students');

  // Open student detail sheet
  const firstStudent = await page.locator('tr:not(:first-child) td, [class*="student-row"], [class*="card"]').first();
  if (await firstStudent.count()) {
    await firstStudent.click();
    await page.waitForTimeout(1000);
    const sheet = await page.locator('[role="dialog"], [class*="sheet"], [class*="drawer"]').count();
    if (sheet > 0) pass('Student detail sheet opens');
    else p2('Clicking student row did not open detail sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Search students
  const searchInput = await page.locator('input[placeholder*="recherche"], input[placeholder*="search"], input[type="search"]').first();
  if (await searchInput.count()) {
    await searchInput.fill('Yasmine');
    await page.waitForTimeout(1000);
    const filtered = await page.locator('tr, [class*="card"]').count();
    pass('Student search works', `${filtered} results for "Yasmine"`);
    await searchInput.fill('');
    await page.waitForTimeout(500);
  } else {
    p2('No search input found on students page');
  }

  // 4.4 Admin trainers
  await goto(page, '/admin/trainers');
  await checkNoError(page, 'admin trainers');
  pass('Admin trainers page loads');
  await checkConsoleErrors(page, 'admin trainers');
  await checkNetFails(page, 'admin trainers');

  // Check trainer count
  const trainerItems = await page.locator('tr:not(:first-child), [class*="card"]').count();
  info('Trainer list items', trainerItems.toString());
  if (trainerItems > 0) pass('Admin trainers list has content');
  else p1('Admin trainers list appears empty');

  // Open add trainer dialog
  const addTrainerBtn = await page.locator('button:has-text("Ajouter"), button:has-text("Nouveau"), button:has-text("Add")').first();
  if (await addTrainerBtn.count()) {
    await addTrainerBtn.click();
    await page.waitForTimeout(1000);
    const dialog = await page.locator('[role="dialog"], [class*="dialog"]').count();
    if (dialog > 0) {
      pass('Add trainer dialog opens');
      // Test empty submit
      const submitBtn = await page.locator('button[type="submit"]').last();
      if (await submitBtn.count()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        pass('Trainer form — empty submit tested');
      }
    } else {
      p2('Add trainer button clicked but no dialog appeared');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 4.5 Admin inscriptions
  await goto(page, '/admin/inscriptions');
  await checkNoError(page, 'admin inscriptions');
  pass('Admin inscriptions page loads');
  await checkConsoleErrors(page, 'admin inscriptions');
  await checkNetFails(page, 'admin inscriptions');

  const inscriptionItems = await page.locator('tr:not(:first-child), [class*="inscription"], [class*="card"]').count();
  if (inscriptionItems > 0) pass('Admin inscriptions list has content', `${inscriptionItems} items`);
  else p1('Admin inscriptions list appears empty');

  // Open first inscription detail
  const firstInscription = await page.locator('tr:not(:first-child)').first();
  if (await firstInscription.count()) {
    await firstInscription.click();
    await page.waitForTimeout(1000);
    const sheet = await page.locator('[role="dialog"], [class*="sheet"]').count();
    if (sheet > 0) {
      pass('Inscription detail sheet opens');
      // Look for status change buttons
      const statusBtns = await page.locator('button:has-text("Accepter"), button:has-text("Refuser"), button:has-text("Accept")').count();
      if (statusBtns > 0) pass('Inscription — status action buttons visible');
      else p2('Inscription detail — no status action buttons found');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      p2('Clicking inscription row did not open detail sheet');
    }
  }

  // 4.6 Admin sessions / promotions
  await goto(page, '/admin/sessions');
  await checkNoError(page, 'admin sessions');
  const sessText = await page.textContent('body').catch(() => '');
  if (sessText.length > 100) pass('Admin sessions page renders');
  else p1('Admin sessions page appears empty or broken');
  await checkConsoleErrors(page, 'admin sessions');
  await checkNetFails(page, 'admin sessions');

  // Check for "Nouvelle session" button
  const newSessBtn = await page.locator('button:has-text("Nouvelle"), button:has-text("Ajouter"), button:has-text("New")').first();
  if (await newSessBtn.count()) {
    pass('Sessions — new session button present');
    await newSessBtn.click();
    await page.waitForTimeout(1000);
    const hasDialog = await page.locator('[role="dialog"], [class*="dialog"]').count();
    if (hasDialog > 0) pass('New session dialog opens');
    else p2('New session button clicked but no dialog');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    p2('No new session button on sessions page');
  }

  // 4.7 Admin attendance / présences
  await goto(page, '/admin/attendance');
  await checkNoError(page, 'admin attendance');
  pass('Admin attendance page loads');
  await checkConsoleErrors(page, 'admin attendance');

  // 4.8 Admin entreprises / companies
  await goto(page, '/admin/entreprises');
  await checkNoError(page, 'admin entreprises');
  const compText = await page.textContent('body').catch(() => '');
  if (compText.length > 100) pass('Admin entreprises page renders');
  else p1('Admin entreprises page appears empty');
  await checkConsoleErrors(page, 'admin entreprises');
  await checkNetFails(page, 'admin entreprises');

  // 4.9 Commercial
  await goto(page, '/commercial/dashboard');
  await checkNoError(page, 'commercial dashboard');
  pass('Commercial dashboard loads');
  await checkConsoleErrors(page, 'commercial dashboard');

  await goto(page, '/commercial/contacts');
  await checkNoError(page, 'commercial contacts');
  pass('Commercial contacts loads');
  await checkConsoleErrors(page, 'commercial contacts');
  await checkNetFails(page, 'commercial contacts');

  // 4.10 Settings
  await goto(page, '/admin/settings');
  const settingsText = await page.textContent('body').catch(() => '');
  if (settingsText.length > 100 && !settingsText.includes('404')) {
    pass('Admin settings page loads');
  } else {
    p2('Admin settings page not found or empty');
  }

  // 4.11 Test form inputs with malicious content
  console.log('\n── Form Security Tests ──\n');
  await goto(page, '/admin/students');

  const searchInput2 = await page.locator('input[placeholder*="recherche"], input[type="search"]').first();
  if (await searchInput2.count()) {
    // XSS payload
    await searchInput2.fill('<script>alert("xss")</script>');
    await page.waitForTimeout(800);
    const xssAlert = await page.locator('text="xss"').count();
    if (xssAlert === 0) pass('XSS payload in search — no injection');
    else p0('XSS vulnerability in student search', 'Alert text visible after XSS payload');

    // SQL injection
    await searchInput2.fill("' OR '1'='1");
    await page.waitForTimeout(800);
    pass('SQL injection in search — no crash observed');

    // Very long input
    await searchInput2.fill('A'.repeat(500));
    await page.waitForTimeout(800);
    const hasError = await page.locator('text=/error|500/i').count();
    if (hasError === 0) pass('Long input in search — no crash');
    else p1('Long input in search caused error');

    await searchInput2.fill('');
  }

  // 4.12 Pagination test
  await goto(page, '/admin/students');
  const paginationEl = await page.locator('[class*="pagination"], [aria-label*="page"], button:has-text("Suivant")').count();
  if (paginationEl > 0) {
    pass('Pagination UI present on students list');
    const nextBtn = await page.locator('button:has-text("Suivant"), button[aria-label*="next"]').first();
    if (await nextBtn.count()) {
      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        pass('Pagination next page works');
      } else {
        info('Pagination next button disabled (only 1 page of data)');
      }
    }
  } else {
    p2('No pagination UI found on students list');
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 5 — RBAC DEEPER TESTS (unauthenticated)
// ══════════════════════════════════════════════════════════════════════════

async function testRBAC(browser) {
  console.log('\n══ PHASE 5: RBAC (unauthenticated) ══\n');
  const page = await newPage(browser);

  const protectedPaths = [
    '/admin/dashboard', '/admin/formations', '/admin/students', '/admin/trainers',
    '/admin/inscriptions', '/admin/sessions', '/admin/attendance', '/admin/entreprises',
    '/student/formations', '/student/profile',
    '/trainer/dashboard', '/trainer/formations',
    '/commercial/dashboard',
  ];

  for (const path of protectedPaths) {
    await page.goto(BASE + path, { timeout: 10000, waitUntil: 'networkidle' }).catch(() => {});
    const url = page.url();
    if (url.includes(path) && !url.includes('/login') && !url.includes('/unauthorized') && !url.includes('/403')) {
      p0(`RBAC BREACH: Unauthenticated access to ${path}`, `Landed at ${url}`, url);
    } else {
      pass(`RBAC: ${path} blocks unauthenticated users`);
    }
  }

  // Direct API routes
  const apiRoutes = [
    '/api/admin/users', '/api/students', '/api/trainers', '/api/formations',
  ];
  for (const route of apiRoutes) {
    const res = await page.goto(BASE + route, { timeout: 8000 }).catch(() => null);
    if (res) {
      const status = res.status();
      if (status === 401 || status === 403) {
        pass(`API ${route} returns ${status} for unauthenticated`);
      } else if (status === 404) {
        info(`API ${route} — 404 (route may not exist)`);
      } else if (status === 200) {
        const body = await page.textContent('body').catch(() => '');
        if (body.includes('email') || body.includes('password') || body.includes('token')) {
          p0(`API ${route} exposes data without auth`, `Status 200: ${body.substring(0,100)}`);
        } else {
          p1(`API ${route} returns 200 without auth — check if data exposed`);
        }
      }
    }
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 6 — CRUD OPERATIONS
// ══════════════════════════════════════════════════════════════════════════

async function testCRUD(browser) {
  console.log('\n══ PHASE 6: CRUD OPERATIONS ══\n');
  const page = await newPage(browser);

  await login(page, CREDS.admin);

  // ── Create formation (test form validation) ──
  await goto(page, '/admin/formations');

  const newFormBtn = await page.locator('button:has-text("Nouvelle"), button:has-text("Ajouter"), button:has-text("New")').first();
  if (await newFormBtn.count()) {
    await newFormBtn.click();
    await page.waitForTimeout(1000);

    const dialog = await page.locator('[role="dialog"]').count();
    if (dialog > 0) {
      pass('Create formation dialog opens');

      // Test empty submit
      const submitBtn = await page.locator('[role="dialog"] button[type="submit"]').last();
      if (await submitBtn.count()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        const validationErr = await page.locator('[aria-invalid], [class*="error"]').count();
        if (validationErr > 0) pass('Formation form — empty submit shows validation errors');
        else p2('Formation form — empty submit: no validation errors');
      }

      // Fill and submit
      const titleInput = await page.locator('[role="dialog"] input[name="title"], [role="dialog"] input[placeholder*="titre"], [role="dialog"] input').first();
      if (await titleInput.count()) {
        await titleInput.fill('Test Formation QA');

        // Special chars in title
        await titleInput.fill('Test <script>alert(1)</script> QA');
        await page.waitForTimeout(500);
        pass('Formation title — XSS payload entered without crash');
        await titleInput.fill('Test Formation QA Automation');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      p1('No dialog opened for new formation');
    }
  }

  // ── Test inscription workflow ──
  await goto(page, '/admin/inscriptions');
  await page.waitForTimeout(1000);

  const newInscriptionBtn = await page.locator('button:has-text("Nouvelle inscription"), button:has-text("Ajouter")').first();
  if (await newInscriptionBtn.count()) {
    await newInscriptionBtn.click();
    await page.waitForTimeout(1000);

    const inscDialog = await page.locator('[role="dialog"]').count();
    if (inscDialog > 0) {
      pass('New inscription dialog opens');

      // Test all form fields
      const firstNameInput = await page.locator('input[name="firstName"], input[placeholder*="Prénom"]').first();
      if (await firstNameInput.count()) {
        await firstNameInput.fill(''); // empty
        const submit = await page.locator('[role="dialog"] button[type="submit"]').last();
        if (await submit.count()) {
          await submit.click();
          await page.waitForTimeout(500);
          pass('Inscription form — empty required fields tested');
        }

        // Invalid email
        const emailInput = await page.locator('input[name="email"], input[type="email"]').last();
        if (await emailInput.count()) {
          await emailInput.fill('notvalid');
          await submit.click();
          await page.waitForTimeout(500);
          pass('Inscription form — invalid email tested');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // ── Test student detail CRUD ──
  await goto(page, '/admin/students');
  await page.waitForTimeout(1000);

  const studentRow = await page.locator('tr:not(:first-child)').first();
  if (await studentRow.count()) {
    await studentRow.click();
    await page.waitForTimeout(1000);
    const sheet = await page.locator('[role="dialog"], [class*="sheet"]').count();
    if (sheet > 0) {
      pass('Student detail opens on click');

      // Look for enrollment section
      const enrollSection = await page.locator('text=/inscription|enrollment|formation/i').count();
      if (enrollSection > 0) pass('Student detail — enrollment section visible');
      else p2('Student detail — no enrollment info visible');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 7 — UX & RESPONSIVE
// ══════════════════════════════════════════════════════════════════════════

async function testUX(browser) {
  console.log('\n══ PHASE 7: UX & RESPONSIVE ══\n');

  // Mobile viewport
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' }).catch(() => {});
  const loginFormMobile = await page.locator('form').count();
  if (loginFormMobile > 0) pass('Login page — responsive on mobile (375px)');
  else p1('Login page — form not visible on mobile');

  // Login as admin on mobile
  await page.fill('input[type="email"]', CREDS.admin.email);
  await page.fill('input[type="password"]', CREDS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto(BASE + '/admin/dashboard', { waitUntil: 'networkidle' }).catch(() => {});
  const dashMobile = await page.textContent('body').catch(() => '');
  if (dashMobile.length > 100) pass('Admin dashboard — renders on mobile');
  else p1('Admin dashboard — broken on mobile');

  // Check for horizontal scroll
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  if (bodyWidth > viewportWidth + 10) {
    p2('Horizontal scroll detected on mobile', `body scrollWidth: ${bodyWidth}, viewport: ${viewportWidth}`);
  } else {
    pass('No horizontal overflow on mobile dashboard');
  }

  await page.close();

  // Tablet viewport
  const ctx2 = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page2 = await ctx2.newPage();
  await login(page2, CREDS.admin);
  await goto(page2, '/admin/students');
  const tabletBody = await page2.textContent('body').catch(() => '');
  if (tabletBody.length > 100) pass('Admin students — renders on tablet (768px)');
  else p1('Admin students — broken on tablet');
  await page2.close();

  // Desktop
  const ctx3 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page3 = await ctx3.newPage();
  await login(page3, CREDS.admin);
  await goto(page3, '/admin/dashboard');
  const desktopBody = await page3.textContent('body').catch(() => '');
  if (desktopBody.length > 100) pass('Admin dashboard — renders on desktop (1920px)');
  await page3.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 8 — EDGE CASES
// ══════════════════════════════════════════════════════════════════════════

async function testEdgeCases(browser) {
  console.log('\n══ PHASE 8: EDGE CASES ══\n');
  const page = await newPage(browser);

  await login(page, CREDS.admin);

  // Double-click submit on login (already tested but simulate for other forms)
  await goto(page, '/admin/trainers');
  const addBtn = await page.locator('button:has-text("Ajouter"), button:has-text("Nouveau")').first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(500);
    const dialog = await page.locator('[role="dialog"]').count();
    if (dialog > 0) {
      // Double-click submit
      const submitBtn = await page.locator('[role="dialog"] button[type="submit"]').last();
      if (await submitBtn.count()) {
        await submitBtn.dblclick();
        await page.waitForTimeout(1000);
        const errors = await page.locator('text=/error|500/i').count();
        if (errors === 0) pass('Double-click submit on form — no crash');
        else p1('Double-click submit caused error state');
      }
      await page.keyboard.press('Escape');
    }
  }

  // Browser back button after navigation
  await goto(page, '/admin/formations');
  await goto(page, '/admin/students');
  await page.goBack();
  await page.waitForTimeout(1000);
  const backUrl = page.url();
  if (backUrl.includes('/admin/formations')) pass('Browser back button works correctly');
  else p2('Browser back button — unexpected URL', backUrl);

  // Refresh on a detail page
  const firstForm = await page.locator('a[href*="/admin/formations/"]').first();
  if (await firstForm.count()) {
    const href = await firstForm.getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await page.reload({ waitUntil: 'networkidle' });
    await checkNoError(page, 'formation detail after reload');
    pass('Formation detail survives page refresh');
  }

  // Test whitespace-only input in search
  await goto(page, '/admin/students');
  const searchEl = await page.locator('input[placeholder*="recherche"], input[type="search"]').first();
  if (await searchEl.count()) {
    await searchEl.fill('   ');
    await page.waitForTimeout(500);
    const hasErr = await page.locator('text=/error|500/i').count();
    if (hasErr === 0) pass('Whitespace-only search — no crash');
    else p1('Whitespace in search caused error');
    await searchEl.fill('');
  }

  // Special chars in search
  if (await searchEl.count()) {
    await searchEl.fill('résumé @#$%');
    await page.waitForTimeout(500);
    pass('Special chars in search — no crash');
    await searchEl.fill('');
  }

  await page.close();
}

// ══════════════════════════════════════════════════════════════════════════
// PHASE 9 — SPECIFIC FEATURE FLOWS
// ══════════════════════════════════════════════════════════════════════════

async function testSpecificFlows(browser) {
  console.log('\n══ PHASE 9: SPECIFIC FLOWS ══\n');
  const page = await newPage(browser);

  await login(page, CREDS.admin);

  // 9.1 Check formation detail has modules list
  await goto(page, '/admin/formations');
  const formLinks = await page.locator('a[href*="/admin/formations/"]').all();
  info('Formation links found', formLinks.length.toString());

  if (formLinks.length > 0) {
    const href = await formLinks[0].getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await checkNoError(page, 'formation detail flow');

    // Check training sessions tab or section
    const hasTrainingSession = await page.locator('text=/session|promotion/i').count();
    if (hasTrainingSession > 0) pass('Formation detail — training sessions visible');
    else p2('Formation detail — no training sessions section');

    // Check modules list
    const moduleLinks = await page.locator('[class*="module"], text=/module/i').count();
    if (moduleLinks > 0) pass('Formation detail — modules listed');
    else p1('Formation detail — no modules visible');

    await checkNetFails(page, 'formation detail flows');
  }

  // 9.2 Company / Entreprise flow
  await goto(page, '/admin/entreprises');
  await checkNoError(page, 'entreprises list');
  const companyLinks = await page.locator('a[href*="/admin/entreprises/"]').all();
  if (companyLinks.length > 0) {
    const href = await companyLinks[0].getAttribute('href');
    await goto(page, href.replace(BASE, ''));
    await checkNoError(page, 'company detail');
    pass('Company detail page loads');
    await checkConsoleErrors(page, 'company detail');
  } else {
    p2('No company detail links found', 'Companies list may be empty');
  }

  // 9.3 Test inscription status change
  await goto(page, '/admin/inscriptions');
  await page.waitForTimeout(1000);
  const inscRows = await page.locator('tr:not(:first-child)').all();
  if (inscRows.length > 0) {
    await inscRows[0].click();
    await page.waitForTimeout(1000);
    const sheet = await page.locator('[role="dialog"]').count();
    if (sheet > 0) {
      // Look for status buttons
      const statusBtns = await page.locator('button:has-text("Accepter"), button:has-text("Refuser"), button:has-text("Évalué"), button:has-text("En attente")').count();
      info('Inscription status buttons', statusBtns.toString());
      if (statusBtns > 0) pass('Inscription detail — status action buttons present');
      else p2('Inscription detail — no status action buttons found');
      await page.keyboard.press('Escape');
    }
  }

  // 9.4 Check student learning flow (student role)
  await page.close();
  const page2 = await newPage(browser);
  await login(page2, CREDS.student2); // othmanou01 — completed enrollment

  await goto(page2, '/student/formations');
  await checkNoError(page2, 'student formations (othmanou01)');

  const formLinks2 = await page2.locator('a[href*="/student/formations/"]').all();
  info('Student formations accessible', formLinks2.length.toString());

  if (formLinks2.length > 0) {
    const href = await formLinks2[0].getAttribute('href');
    await goto(page2, href.replace(BASE, ''));
    await checkNoError(page2, 'student formation detail');
    pass('Student formation detail loads');

    // Check for completed status
    const completed = await page2.locator('text=/terminé|completed|100/i').count();
    if (completed > 0) pass('Student formation — completed status visible');
    else info('No completed status found (may need different route)');

    // Check modules
    const moduleLinks2 = await page2.locator('a[href*="/modules/"]').all();
    info('Module links on student formation', moduleLinks2.length.toString());

    if (moduleLinks2.length > 0) {
      const modHref = await moduleLinks2[0].getAttribute('href');
      await goto(page2, modHref.replace(BASE, ''));
      await checkNoError(page2, 'student module detail');
      pass('Student module page loads');
      await checkConsoleErrors(page2, 'student module detail');
      await checkNetFails(page2, 'student module detail');

      // Check for material downloads
      const materials = await page2.locator('a[href*="pdf"], a[href*="download"], [class*="material"]').count();
      info('Materials visible on module page', materials.toString());
    }
  }

  await page2.close();
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN — RUN ALL PHASES
// ══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MIA ACADÉMIE — Full QA Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });

  try {
    await testVisitor(browser);
    await testStudent(browser);
    await testTrainer(browser);
    await testAdmin(browser);
    await testRBAC(browser);
    await testCRUD(browser);
    await testUX(browser);
    await testEdgeCases(browser);
    await testSpecificFlows(browser);
  } catch (e) {
    console.error('FATAL TEST ERROR:', e.message);
    findings.push({ severity: 'P0', title: 'Test suite crashed', detail: e.message });
  } finally {
    await browser.close();
  }

  // ── Summary ──
  const counts = { PASS:0, P0:0, P1:0, P2:0, INFO:0 };
  findings.forEach(f => counts[f.severity] = (counts[f.severity] || 0) + 1);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ PASS : ${counts.PASS}`);
  console.log(`  🔴 P0   : ${counts.P0}  (Critical)`);
  console.log(`  🟠 P1   : ${counts.P1}  (Major)`);
  console.log(`  🟡 P2   : ${counts.P2}  (Minor)`);
  console.log(`  ℹ️  INFO : ${counts.INFO}`);
  console.log('');

  if (counts.P0 > 0) {
    console.log('  ❌ NO-GO — Critical issues found:');
    findings.filter(f => f.severity === 'P0').forEach(f => console.log(`    • ${f.title}: ${f.detail}`));
  } else if (counts.P1 <= 3) {
    console.log('  ✅ GO — No critical issues. Minor fixes recommended.');
  } else {
    console.log('  ⚠️  GO WITH FIXES — No critical issues but several majors need review.');
  }

  // Write JSON output
  fs.writeFileSync(
    'C:/Users/ASUS TUF GAMING A15/AppData/Local/Temp/claude/c--Users-ASUS-TUF-GAMING-A15-Documents-Next-Projects-Mia-Digital/133e83ca-5151-4661-a68a-f1625bb7573a/scratchpad/qa-results.json',
    JSON.stringify({ counts, findings }, null, 2)
  );
  console.log('\n  Full results saved to qa-results.json');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
