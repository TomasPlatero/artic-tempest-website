"use client"

import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    Klass,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from "lexical"

import { $applyNodeReplacement, DecoratorNode } from "lexical"
import ImageComponent from "./ImageComponent"

export interface ImagePayload {
    altText: string
    height?: number
    key?: NodeKey
    maxWidth?: number
    src: string
    width?: number
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
    if (domNode instanceof HTMLImageElement) {
        const { src, alt } = domNode
        const node = $createImageNode({ src, altText: alt })
        return { node }
    }
    return null
}

export type SerializedImageNode = Spread<
    {
        altText: string
        height?: number
        maxWidth?: number
        src: string
        width?: number
    },
    SerializedLexicalNode
>

export class ImageNode extends DecoratorNode<React.JSX.Element> {
    __src: string
    __altText: string
    __width: "inherit" | number
    __height: "inherit" | number
    __maxWidth: number

    static getType(): string {
        return "image"
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__width,
            node.__height,
            node.__maxWidth,
            node.__key
        )
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, height, maxWidth, src, width } = serializedNode
        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            src,
            width,
        })
        return node
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("img")
        element.setAttribute("src", this.__src)
        element.setAttribute("alt", this.__altText)
        return { element }
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: (node: Node) => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        }
    }

    constructor(
        src: string,
        altText: string,
        width?: "inherit" | number,
        height?: "inherit" | number,
        maxWidth?: number,
        key?: NodeKey
    ) {
        super(key)
        this.__src = src
        this.__altText = altText
        this.__width = width || "inherit"
        this.__height = height || "inherit"
        this.__maxWidth = maxWidth || 500
    }

    exportJSON(): SerializedImageNode {
        return {
            altText: this.getAltText(),
            height: this.__height === "inherit" ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.getSrc(),
            type: "image",
            version: 1,
            width: this.__width === "inherit" ? 0 : this.__width,
        }
    }

    setWidthAndHeight(
        width: "inherit" | number,
        height: "inherit" | number
    ): void {
        const writable = this.getWritable()
        writable.__width = width
        writable.__height = height
    }

    getSrc(): string {
        return this.__src
    }

    getAltText(): string {
        return this.__altText
    }

    decorate(editor: LexicalEditor, config: EditorConfig): React.JSX.Element | null {
        return (
            <ImageComponent
                src={this.__src}
                altText={this.__altText}
                width={this.__width}
                height={this.__height}
                nodeKey={this.getKey()}
            />
        )
    }
}

export function $createImageNode({
    altText,
    height,
    maxWidth,
    src,
    width,
    key,
}: ImagePayload): ImageNode {
    return $applyNodeReplacement(
        new ImageNode(src, altText, width, height, maxWidth, key)
    )
}

export function $isImageNode(
    node: LexicalNode | null | undefined
): node is ImageNode {
    return node instanceof ImageNode
}
