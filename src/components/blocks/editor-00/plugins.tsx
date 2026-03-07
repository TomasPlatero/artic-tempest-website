import { useState } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS } from "@lexical/markdown"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { ContentEditable } from "@/components/editor/editor-ui/content-editable"

import { Toolbar } from "./toolbar"
import { SlashCommandPlugin } from "./slash-command-plugin"
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin"
import { ImagePlugin } from "./ImagePlugin"

const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
    };
  },
];

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="relative">
      <Toolbar />
      <div className="relative overflow-auto min-h-[400px]">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <TablePlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={MATCHERS} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <HorizontalRulePlugin />
        <ImagePlugin />

        {floatingAnchorElem && (
          <SlashCommandPlugin />
        )}
      </div>
    </div>
  )
}
