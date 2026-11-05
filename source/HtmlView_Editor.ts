import "./HtmlView_Editor.css"

export {
  _HtmlView_Editor_,
  type _Api__HtmlView_Editor_,
  type _ViewModel_Editor_,
  type _Line_ViewModel_
}

class _HtmlView_Editor_ {
  containerElement: HTMLElement

  constructor({
    containerElement
  }: _Api__HtmlView_Editor_) {
    this.containerElement = containerElement
    this.containerElement.classList.add("htmlView_editor")
  }

  draw(
    viewModel_Editor: _ViewModel_Editor_
  ): void {
    draw__HtmlView_Editor({
      viewModel_Editor,
      containerElement__HtmlView_Editor: this.containerElement
    })
  }
}

interface _Api__HtmlView_Editor_ {
  containerElement: HTMLElement
}

interface _ViewModel_Editor_ {
  lines: Array<_Line_ViewModel_>
}

interface _Line_ViewModel_ {
  text: string
}

interface _Api___draw__HtmlView_Editor_ {
  containerElement__HtmlView_Editor: HTMLElement
  viewModel_Editor: _ViewModel_Editor_
}

function draw__HtmlView_Editor({
  containerElement__HtmlView_Editor,
  viewModel_Editor
}: _Api___draw__HtmlView_Editor_): void {
  containerElement__HtmlView_Editor.replaceChildren(
    ...viewModel_Editor.lines.map(toHtmlElement__Line_ViewModel)
  )
}

function toHtmlElement__Line_ViewModel(
  line_ViewModel: _Line_ViewModel_
): HTMLDivElement {
  const divElement_line = document.createElement("div")
  divElement_line.className = "line_htmlView"
  divElement_line.textContent = line_ViewModel.text
  return divElement_line
}
