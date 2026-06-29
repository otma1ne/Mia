import type { Metadata } from 'next'
import { getCategories } from '@/app/actions/categories'
import CategoriesClient from './_components/categories-client'

export const metadata: Metadata = { title: "Secteurs d'activité — MIA Académie" }

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="p-4 lg:p-6">
      <CategoriesClient categories={categories} />
    </div>
  )
}
