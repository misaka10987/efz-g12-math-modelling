import { createUniqueId, onMount } from 'solid-js'
import ChartJS from 'chart.js/auto'

export const Chart = () => {
  const id = createUniqueId()

  onMount(() => {
    const canvas = document.getElementById(id) as HTMLCanvasElement
    new ChartJS(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Parabola',
            data: [
              { x: '1', y: 1 },
              { x: '2', y: 4 },
              { x: '3', y: 9 },
              { x: '4', y: 16 },
              { x: '5', y: 25 },
            ],
            borderWidth: 1,
          },
          {
            label: 'Exponential',
            data: [
              { x: '1', y: 2 },
              { x: '2', y: 4 },
              { x: '3', y: 8 },
              { x: '4', y: 16 },
              { x: '5', y: 32 },
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  })

  return (
    <>
      <div>
        <canvas id={id}></canvas>
      </div>
    </>
  )
}
