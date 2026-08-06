import { Node, mergeAttributes } from "@tiptap/core";

export const PovTabsNode = Node.create({
  name: "povTabs",
  group: "block",
  atom: true,
  draggable: false,

  parseHTML() {
    return [{ tag: "div[data-pov-tabs]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-pov-tabs": "true",
        class:
          "my-6 rounded-2xl border-2 border-blue-500/30 bg-blue-500/10 px-5 py-4 text-center",
      }),
      [
        "span",
        {
          class:
            "text-sm font-bold italic uppercase tracking-[0.2em] text-blue-300",
        },
        "POV de Raiders",
      ],
    ];
  },
});
