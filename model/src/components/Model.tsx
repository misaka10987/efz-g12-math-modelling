import { Chart } from './Chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-solid/Card'

export const Model = () => {
  return (
    <Card class="w-2xl max-w-[90vw]" slot="preview">
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>TODO</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <Chart />
      </CardContent>
      <CardFooter class="flex justify-between" >  aaaa </CardFooter>
    </Card>
  )
}
