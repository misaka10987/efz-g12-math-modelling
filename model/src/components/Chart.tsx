import { createUniqueId, onMount } from 'solid-js'
import ChartJS from 'chart.js/auto'
import { evaluate, neverColonize, porportionalColonize } from '@/model/main'

export const Chart = () => {
  const id = createUniqueId()

  const neverColonizeResult = evaluate(
    {
      initialBaseProductivity: 100,
      colonizationPenalty: 5,
      baseCapacity: 1000,
      colonyCapacity: 500,
    },
    neverColonize,
    100,
  )

  const proportionalColonizeResult = evaluate(
    {
      initialBaseProductivity: 100,
      colonizationPenalty: 5,
      baseCapacity: 1000,
      colonyCapacity: 500,
    },
    porportionalColonize(1 / 2),
    100,
  )

  onMount(() => {
    const canvas = document.getElementById(id) as HTMLCanvasElement
    new ChartJS(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Never Colonize',
            data: neverColonizeResult.map((state, index) => ({
              x: `${index}`,
              y: state.baseProductivity + state.colonyProductivity,
            })),
            borderWidth: 1,
          },
          {
            label: 'Proportional Colonize',
            data: proportionalColonizeResult.map((state, index) => ({
              x: `${index}`,
              y: state.baseProductivity + state.colonyProductivity,
            })),
            borderWidth: 1,
          },
        ],
      },
      options: {
        elements: {
          point: {
            radius: 0,
            hoverRadius: 4,
            hitRadius: 10,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  })

  return (
    <div>
      <canvas id={id}></canvas>
    </div>
  )
}
