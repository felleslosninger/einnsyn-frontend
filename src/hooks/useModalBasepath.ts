// Keep track of the last pathname before a modal is opened.
// A modal is never opened on the server side, so we default to "/".
let modalBasepath = '/';

export function useModalBasepath() {
  return modalBasepath;
}

export function setModalBasepath(nextBasepath: string) {
  modalBasepath = nextBasepath;
}
