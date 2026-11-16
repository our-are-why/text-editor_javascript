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
  drawChildren__Element({
    element: containerElement,
    node_Jsx,
    refs_Drawn
  })
  for (const {
    ref,
    element
  } of refs_Drawn) ref(element)
}

interface _Ref_Drawn_ {
  ref: _Ref_Jsx_
  element: Element
}

interface _Api___drawChildren__Element_ {
  element: Element
  node_Jsx: _Node_Jsx_
  refs_Drawn: Array<_Ref_Drawn_>
}

function drawChildren__Element({
  element,
  node_Jsx,
  refs_Drawn
}: _Api___drawChildren__Element_): void {
  const drawables = drawablesOf__Node_Jsx({
    node_Jsx
  })
  const namespace = namespaceOf__Children(element)
  drawables.forEach((drawable, index) => {
    const node_Drawn = element.childNodes[index] ?? null
    const node = nodeOf__Drawable_Jsx({
      drawable,
      node_Drawn,
      namespace,
      refs_Drawn
    })
    if (node === node_Drawn) return
    if (node.isConnected && element.isConnected) {
      element.moveBefore(
        node,
        node_Drawn
      )
    } else {
      element.insertBefore(
        node,
        node_Drawn
      )
    }
  })
  while (element.childNodes.length > drawables.length) element.lastChild?.remove()
}

interface _Api___drawablesOf__Node_Jsx_ {
  node_Jsx: _Node_Jsx_
}

function drawablesOf__Node_Jsx({
  node_Jsx
}: _Api___drawablesOf__Node_Jsx_): Array<_Drawable_Jsx_> {
  if (node_Jsx === null || node_Jsx === undefined || typeof node_Jsx === "boolean") return []
  if (typeof node_Jsx === "string" || node_Jsx instanceof Node) return [node_Jsx]
  if (Array.isArray(node_Jsx)) {
    return node_Jsx.flatMap((node_Jsx_each) => drawablesOf__Node_Jsx({
      node_Jsx: node_Jsx_each
    }))
  }
  const {
    tag,
    props
  } = node_Jsx
  if (typeof tag === "function") {
    return drawablesOf__Node_Jsx({
      node_Jsx: tag(props)
    })
  }
  return [{
    tag,
    props
  }]
}

type _Drawable_Jsx_ = _Element_Description_Jsx_ | Node | string

interface _Element_Description_Jsx_ {
  tag: _TagName_Jsx_
  props: _Props_Jsx_
}

function namespaceOf__Children(
  element: Element
): string {
  return element.localName === "foreignObject" ? NAMESPACE_HTML : element.namespaceURI ?? NAMESPACE_HTML
}

const NAMESPACE_HTML = "http://www.w3.org/1999/xhtml"

interface _Api___nodeOf__Drawable_Jsx_ {
  drawable: _Drawable_Jsx_
  node_Drawn: ChildNode | null
  namespace: string
  refs_Drawn: Array<_Ref_Drawn_>
}

function nodeOf__Drawable_Jsx({
  drawable,
  node_Drawn,
  namespace,
  refs_Drawn
}: _Api___nodeOf__Drawable_Jsx_): Node {
  if (drawable instanceof Node) return drawable
  if (typeof drawable === "string") {
    if (!(node_Drawn instanceof Text)) return document.createTextNode(drawable)
    if (node_Drawn.data !== drawable) node_Drawn.data = drawable
    return node_Drawn
  }
  return elementOf__Element_Description_Jsx({
    description_Jsx: drawable,
    node_Drawn,
    namespace,
    refs_Drawn
  })
}

interface _Api___elementOf__Element_Description_Jsx_ {
  description_Jsx: _Element_Description_Jsx_
  node_Drawn: ChildNode | null
  namespace: string
  refs_Drawn: Array<_Ref_Drawn_>
}

function elementOf__Element_Description_Jsx({
  description_Jsx,
  node_Drawn,
  namespace,
  refs_Drawn
}: _Api___elementOf__Element_Description_Jsx_): Element {
  const {
    tag,
    props
  } = description_Jsx
  const namespace_Element = tag === "svg" ? NAMESPACE_SVG : namespace
  const {
    children,
    ref,
    ...attributes
  } = props
  const element = elementDrawnFrom__Node({
    node_Drawn,
    tag,
    namespace_Element,
    attributes
  }) ?? document.createElementNS(
    namespace_Element,
    tag
  )
  drawAttributes__Element({
    element,
    attributes
  })
  if (Object.hasOwn(props, "children")) {
    drawChildren__Element({
      element,
      node_Jsx: children,
      refs_Drawn
    })
  }
  if (ref !== undefined) {
    refs_Drawn.push({
      ref,
      element
    })
  }
  return element
}

const NAMESPACE_SVG = "http://www.w3.org/2000/svg"

interface _Api___elementDrawnFrom__Node_ {
  node_Drawn: ChildNode | null
  tag: _TagName_Jsx_
  namespace_Element: string
  attributes: _Attributes_Jsx_
}

interface _Attributes_Jsx_ {
  [name: string]: _Node_Jsx_ | _Ref_Jsx_
}

function elementDrawnFrom__Node({
  node_Drawn,
  tag,
  namespace_Element,
  attributes
}: _Api___elementDrawnFrom__Node_): Element | null {
  for (let node: ChildNode | null = node_Drawn; node !== null; node = node.nextSibling) {
    if (node instanceof Element && isDrawn__Element({
      element: node,
      tag,
      namespace_Element,
      attributes
    })) return node
  }
  return null
}

interface _Api___isDrawn__Element_ {
  element: Element
  tag: _TagName_Jsx_
  namespace_Element: string
  attributes: _Attributes_Jsx_
}

function isDrawn__Element({
  element,
  tag,
  namespace_Element,
  attributes
}: _Api___isDrawn__Element_): boolean {
  return element.localName === tag
    && element.namespaceURI === namespace_Element
    && element.getAttribute("class") === (typeof attributes["class"] === "string" ? attributes["class"] : null)
    && Object.entries(attributes).every(([
      name,
      value
    ]) => !name.startsWith("data-") || typeof value !== "string" || !element.hasAttribute(name) || element.getAttribute(name) === value)
}

interface _Api___drawAttributes__Element_ {
  element: Element
  attributes: _Attributes_Jsx_
}

function drawAttributes__Element({
  element,
  attributes
}: _Api___drawAttributes__Element_): void {
  const values = new Map(Object.entries(attributes).flatMap(([
    name,
    value
  ]) => typeof value === "string"
    ? [[
      name,
      value
    ] as const]
    : []))
  for (const name of element.getAttributeNames()) {
    if (!values.has(name)) element.removeAttribute(name)
  }
  for (const [
    name,
    value
  ] of values) {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(
        name,
        value
      )
    }
  }
}
