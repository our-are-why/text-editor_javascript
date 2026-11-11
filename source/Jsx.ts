export {
  jsx,
  jsx as jsxs,
  jsx as jsxDEV,
  type JSX,
  type _Node_Jsx_,
  draw__Node_Jsx,
  type _Api___draw__Node_Jsx_
}

declare namespace JSX {
  type Element = _Description_Jsx_
  type ElementType = _TagName_Jsx_ | ((props: never) => _Node_Jsx_)
  type IntrinsicElements = {
    [Tag in _TagName_Jsx_]: _Props_Jsx_
  }
  interface ElementChildrenAttribute {
    children: {}
  }
}

type _TagName_Jsx_ = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap

interface _Description_Jsx_ {
  tag: _Tag_Jsx_
  props: _Props_Jsx_
}

type _Tag_Jsx_ = _TagName_Jsx_ | ((props: _Props_Jsx_) => _Node_Jsx_)

interface _Props_Jsx_ {
  [name: string]: _Node_Jsx_ | _Ref_Jsx_
  children?: _Node_Jsx_
  ref?: _Ref_Jsx_
}

type _Node_Jsx_ = _Description_Jsx_ | Node | string | boolean | null | undefined | Array<_Node_Jsx_>

type _Ref_Jsx_ = (element: Element) => void

function jsx(
  tag: _Tag_Jsx_,
  props: _Props_Jsx_
): JSX.Element {
  return {
    tag,
    props
  }
}

interface _Api___draw__Node_Jsx_ {
  node_Jsx: _Node_Jsx_
  containerElement: Element
}

function draw__Node_Jsx({
  node_Jsx,
  containerElement
}: _Api___draw__Node_Jsx_): void {
  const refs_Drawn: Array<_Ref_Drawn_> = []
  containerElement.replaceChildren(...nodesOf__Node_Jsx({
    node_Jsx,
    namespace: namespaceOf__Children(containerElement),
    refs_Drawn
  }))
  for (const {
    ref,
    element
  } of refs_Drawn) ref(element)
}

interface _Ref_Drawn_ {
  ref: _Ref_Jsx_
  element: Element
}

interface _Api___nodesOf__Node_Jsx_ {
  node_Jsx: _Node_Jsx_
  namespace: string
  refs_Drawn: Array<_Ref_Drawn_>
}

function nodesOf__Node_Jsx({
  node_Jsx,
  namespace,
  refs_Drawn
}: _Api___nodesOf__Node_Jsx_): Array<Node | string> {
  if (node_Jsx === null || node_Jsx === undefined || typeof node_Jsx === "boolean") return []
  if (typeof node_Jsx === "string" || node_Jsx instanceof Node) return [node_Jsx]
  if (Array.isArray(node_Jsx)) {
    return node_Jsx.flatMap((node_Jsx_each) => nodesOf__Node_Jsx({
      node_Jsx: node_Jsx_each,
      namespace,
      refs_Drawn
    }))
  }
  return nodesOf__Description_Jsx({
    description_Jsx: node_Jsx,
    namespace,
    refs_Drawn
  })
}

interface _Api___nodesOf__Description_Jsx_ {
  description_Jsx: _Description_Jsx_
  namespace: string
  refs_Drawn: Array<_Ref_Drawn_>
}

function nodesOf__Description_Jsx({
  description_Jsx,
  namespace,
  refs_Drawn
}: _Api___nodesOf__Description_Jsx_): Array<Node | string> {
  const {
    tag,
    props
  } = description_Jsx
  if (typeof tag === "function") {
    return nodesOf__Node_Jsx({
      node_Jsx: tag(props),
      namespace,
      refs_Drawn
    })
  }
  const {
    children,
    ref,
    ...attributes
  } = props
  const element = document.createElementNS(
    tag === "svg" ? NAMESPACE_SVG : namespace,
    tag
  )
  for (const [
    name,
    value
  ] of Object.entries(attributes)) {
    if (typeof value === "string") {
      element.setAttribute(
        name,
        value
      )
    }
  }
  element.append(...nodesOf__Node_Jsx({
    node_Jsx: children,
    namespace: namespaceOf__Children(element),
    refs_Drawn
  }))
  if (ref !== undefined) {
    refs_Drawn.push({
      ref,
      element
    })
  }
  return [element]
}

const NAMESPACE_SVG = "http://www.w3.org/2000/svg"

function namespaceOf__Children(
  element: Element
): string {
  return element.localName === "foreignObject" ? NAMESPACE_HTML : element.namespaceURI ?? NAMESPACE_HTML
}

const NAMESPACE_HTML = "http://www.w3.org/1999/xhtml"
