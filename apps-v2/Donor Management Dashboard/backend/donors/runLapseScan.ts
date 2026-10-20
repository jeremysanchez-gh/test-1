interface Params {}

export default async function runLapseScan(_req: { params: Params }) {
  const result = await workflows.workflowNightlyLapse.trigger()
  return result.data
}
