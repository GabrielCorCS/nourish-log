import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { RecipeForm } from '@/components/recipes'

export function RecipeEditor() {
  const { id } = useParams<{ id: string }>()

  return (
    <PageContainer>
      {/* Editorial header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
          {id ? 'Edit recipe' : 'New recipe'}
        </p>
        <h1 className="font-display text-display font-semibold text-espresso">
          {id ? 'Update Recipe' : 'Create Recipe'}
        </h1>
      </div>

      <RecipeForm recipeId={id} />
    </PageContainer>
  )
}
