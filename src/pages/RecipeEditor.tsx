import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { RecipeForm } from '@/components/recipes'

export function RecipeEditor() {
  const { id } = useParams<{ id: string }>()

  return (
    <PageContainer
      title={id ? 'Edit Recipe' : 'New Recipe'}
      description={id ? 'Update your recipe' : 'Create a new recipe'}
    >
      <RecipeForm recipeId={id} />
    </PageContainer>
  )
}
