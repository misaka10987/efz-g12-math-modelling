import { Chart } from './Chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-solid/Card'
import {
  evaluate,
  neverColonize,
  porportionalColonize,
  type Constants,
} from '@/model/main'
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from './solid-ui/Switch'
import { createMemo, createSignal } from 'solid-js'
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from './shadcn-solid/numberfield'

const ConfigSection = (props: { title: string; children?: any }) => {
  return (
    <section class="m-2 mt-6 flex flex-col gap-4">
      <h2>{props.title}</h2>
      <div class="grid grid-cols-2 gap-8">{props.children}</div>
    </section>
  )
}

export const Model = () => {
  const [constants, setConstants] = createSignal<Constants>({
    colonizationPenalty: 5,
    baseLogistic: true,
    baseCapacity: 10,
    colonyLogistic: true,
    colonyCapacity: 5,
  })

  const [generation, setGeneration] = createSignal(120)

  const neverColonizeResult = createMemo(() => {
    return evaluate(constants(), neverColonize, generation())
  })

  const proportionalColonizeResult = createMemo(() => {
    return evaluate(constants(), porportionalColonize(1 / 2), generation())
  })

  const data = createMemo(() => {
    return [
      {
        label: 'Never Colonize',
        data: neverColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      },
      {
        label: 'Proportional Colonize',
        data: proportionalColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      },
    ]
  })

  return (
    <Card class="w-2xl max-w-[90vw]" slot="preview">
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>Generation = 1/12 of Doubling Period</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <Chart data={data()} />
      </CardContent>
      <CardFooter>
        <details class="w-full">
          <summary class="font-semibold">Parameters</summary>
          <ConfigSection title="Generic">
            <NumberField
              value={generation()}
              defaultValue={120}
              required
              minValue={1}
              // a very high value results in performance issues
              maxValue={1200}
              onChange={setGeneration}
            >
              <NumberFieldLabel>Simulate Generation</NumberFieldLabel>
              <NumberFieldGroup>
                <NumberFieldDecrementTrigger aria-label="Decrement" />
                <NumberFieldInput />
                <NumberFieldIncrementTrigger aria-label="Increment" />
              </NumberFieldGroup>
            </NumberField>
          </ConfigSection>
          <ConfigSection title="Logistic Growth">
            <div class="flex flex-col gap-4">
              <Switch
                class="flex items-center space-x-2"
                checked={constants().baseLogistic}
                onChange={(x) => {
                  setConstants((c) => ({ ...c, baseLogistic: x }))
                }}
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>Logistic Base Growth</SwitchLabel>
              </Switch>

              <NumberField
                hidden={!constants().baseLogistic}
                value={constants().baseCapacity}
                defaultValue={1}
                required
                minValue={1}
                onChange={(x) =>
                  setConstants((c) => ({ ...c, baseCapacity: Number(x) }))
                }
              >
                <NumberFieldLabel>Capacity</NumberFieldLabel>
                <NumberFieldGroup>
                  <NumberFieldDecrementTrigger aria-label="Decrement" />
                  <NumberFieldInput />
                  <NumberFieldIncrementTrigger aria-label="Increment" />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <div class="flex flex-col gap-4">
              <Switch
                class="flex items-center space-x-2"
                checked={constants().colonyLogistic}
                onChange={(x) => {
                  setConstants((c) => ({ ...c, colonyLogistic: x }))
                }}
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>Logistic Colony Growth</SwitchLabel>
              </Switch>

              <NumberField
                hidden={!constants().colonyLogistic}
                value={constants().colonyCapacity}
                defaultValue={1}
                required
                minValue={1}
                onChange={(x) =>
                  setConstants((c) => ({ ...c, colonyCapacity: Number(x) }))
                }
              >
                <NumberFieldLabel>Capacity</NumberFieldLabel>
                <NumberFieldGroup>
                  <NumberFieldDecrementTrigger aria-label="Decrement" />
                  <NumberFieldInput />
                  <NumberFieldIncrementTrigger aria-label="Increment" />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </ConfigSection>
          <ConfigSection title="Colonization Penalty">
            <NumberField
              value={constants().colonizationPenalty}
              defaultValue={2}
              required
              minValue={1}
              onChange={(x) =>
                setConstants((c) => ({ ...c, colonizationPenalty: Number(x) }))
              }
            >
              <NumberFieldLabel>Coefficient</NumberFieldLabel>
              <NumberFieldGroup>
                <NumberFieldDecrementTrigger aria-label="Decrement" />
                <NumberFieldInput />
                <NumberFieldIncrementTrigger aria-label="Increment" />
              </NumberFieldGroup>
            </NumberField>
          </ConfigSection>
        </details>
      </CardFooter>
    </Card>
  )
}
