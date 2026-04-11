import { Chart } from './Chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-solid/Card'
import { evaluate, neverColonize, porportionalColonize } from '@/model/main'

export const Model = () => {
  const neverColonizeResult = evaluate(
    {
      colonizationPenalty: 5,
      baseCapacity: 10,
      colonyCapacity: 5,
    },
    neverColonize,
    100,
  )

  const proportionalColonizeResult = evaluate(
    {
      colonizationPenalty: 5,
      baseCapacity: 10,
      colonyCapacity: 5,
    },
    porportionalColonize(1 / 2),
    100,
  )

  return (
    <Card class="w-2xl max-w-[90vw]" slot="preview">
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>Generation = 1/12 of Doubling Period</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <Chart
          data={[
            {
              label: 'Never Colonize',
              data: neverColonizeResult.map((state, index) => ({
                x: index,
                y: state.baseProductivity + state.colonyProductivity,
              })),
              borderWidth: 1,
            },
            {
              label: 'Proportional Colonize',
              data: proportionalColonizeResult.map((state, index) => ({
                x: index,
                y: state.baseProductivity + state.colonyProductivity,
              })),
              borderWidth: 1,
            },
          ]}
        />
      </CardContent>
      <CardFooter>
        <details class="leading-loose">
          <summary class="font-semibold">Parameters</summary>
          <section>
            <p>TODO</p>
          </section>
        </details>
      </CardFooter>
    </Card>
  )
}
