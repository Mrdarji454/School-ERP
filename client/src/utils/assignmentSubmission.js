// Local validation has not sent anything and must never freeze the editor.
// Once sent, an unknown/server/timeout outcome retains the exact retry attempt.
export function uncertainSubmission(error, attemptExists) {
  return Boolean(attemptExists) && (!error.response || error.response.status >= 500 || error.response.status === 408);
}
