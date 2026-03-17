"use client";

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import tippy, { Instance } from 'tippy.js';
import {
    IconBold,
    IconItalic,
    IconUnderline,
    IconLink,
    IconPhoto,
    IconList,
    IconListNumbers,
    IconQuote,
    IconCode,
    IconClearFormatting,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconMoodSmile
} from '@tabler/icons-react';
import { cn } from '@/shared/tailwind/tailwind-utils';
import { Button } from './button';
import { useEffect } from 'react';
import { EmojiPicker } from '../components/emoji-picker';
import { MentionList } from './mention-list';
import { EmojiSuggestionList } from './emoji-suggestion-list';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const ALL_EMOJIS = ["🔥", "✨", "✅", "🎮", "⚔️", "💎", "🚀", "❤️", "👍", "👑", "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😾", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "🎮", "🕹️", "💻", "⌨️", "🖱️", "🖥️", "🎧", "🎤", "🎬", "📺", "📱", "⚔️", "🛡️", "🏹", "🗡️", "🪓", "💣", "🧨", "🐲", "🐉", "🐺", "🦁", "🐯", "💎", "🥇", "🥈", "🥉", "🏆", "🎯", "🎲", "🎰", "🎳", "🎭", "🎨", "🧵", "🧶", "🎼", "🎵", "🎶", "🎹", "🎸", "🎺", "🎻", "🥁", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐒", "🦍", "🦧", "🐕", "🐩", "🐺", "🦝", "🐈", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐂", "🐃", "🐄", "🐷", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐿️", "🦫", "🦔", "🦇", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🎄", "🌱", "🌿", "☘️", "🍀", "🍃", "🍂", "🍁", "🍄", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄️", "💥", "🔥", "🌪️", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "🌩️", "❄️", "☃️", "💨", "💧", "💦", "☔", "🌊", "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "バター", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "🔱", "⚜️", "⚠️", "🚸", "🔰", "♻️", "🈯", "💹", "❇️", "✳️", "❎", "✅", "💠", "🌀", "➿", "🌐", "Ⓜ️", "🏧", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🚾", "♿", "🅿️", "🈳", "🈵", "🚰", "📶", "🎦", "🔣", "🔡", "🔤", "🔠", "🔲", "🔳", "🔘", "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "📅", "📆", "🗓️", "🗑️", "🗒️", "📋", "⌛", "⏳", "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🌡️", "☀️", "⭐", "🌙", "☁️", "⛅", "⚡", "❄️", "🔥", "💧", "🌊"];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline decoration-blue-500/30 hover:text-blue-300 transition-colors cursor-pointer font-bold',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl border border-white/10 my-4 max-w-full h-auto shadow-2xl',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Empieza a escribir...',
                emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-white/10 before:h-0 before:float-left before:pointer-events-none italic',
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md font-black uppercase text-[11px] tracking-tight border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] no-underline',
                },
                suggestion: {
                    render: () => {
                        let component: ReactRenderer<any>;
                        let popup: Instance[];

                        return {
                            onStart: (props) => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect as any,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },

                            onUpdate(props) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect as any,
                                });
                            },

                            onKeyDown(props) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }

                                return (component.ref as any)?.onKeyDown(props);
                            },

                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                    items: async ({ query }) => {
                        if (!query || query.length < 1) return [];
                        try {
                            const response = await fetch(`/api/guild/members/search?q=${query}`);
                            const data = await response.json();
                            return data;
                        } catch (e) {
                            return [];
                        }
                    },
                },
            }),
            Mention.extend({
                name: 'emojiSuggestion',
            }).configure({
                suggestion: {
                    char: ':',
                    items: ({ query }) => {
                        // Very simple filtering for now
                        return ALL_EMOJIS.slice(0, 10);
                    },
                    render: () => {
                        let component: ReactRenderer<any>;
                        let popup: Instance[];

                        return {
                            onStart: (props) => {
                                component = new ReactRenderer(EmojiSuggestionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect as any,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },

                            onUpdate(props) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect as any,
                                });
                            },

                            onKeyDown(props) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }

                                return (component.ref as any)?.onKeyDown(props);
                            },

                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                    command: ({ editor, range, props }) => {
                        editor
                            .chain()
                            .focus()
                            .insertContentAt(range, props.name)
                            .insertContent(' ')
                            .run();
                    },
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[160px] px-4 py-3 text-sm leading-relaxed text-zinc-200 prose-p:my-1 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-blockquote:border-l-blue-500/30 prose-blockquote:bg-white/5 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-xl',
            },
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (editor && value === "" && editor.getHTML() !== "<p></p>") {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt('URL del enlace');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('URL de la imagen');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 overflow-hidden focus-within:border-blue-500/30 transition-all shadow-xl backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-white/[0.02] border-b border-white/5">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    icon={IconBold}
                    tooltip="Negrita"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    icon={IconItalic}
                    tooltip="Cursiva"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    icon={IconUnderline}
                    tooltip="Subrayado"
                />
                <div className="w-px h-4 bg-white/5 mx-1" />
                <MenuButton
                    onClick={addLink}
                    active={editor.isActive('link')}
                    icon={IconLink}
                    tooltip="Insertar Enlace"
                />
                <MenuButton
                    onClick={addImage}
                    icon={IconPhoto}
                    tooltip="Adjuntar Imagen"
                />
                <div className="w-px h-4 bg-white/5 mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    icon={IconList}
                    tooltip="Lista"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    icon={IconListNumbers}
                    tooltip="Lista Numerada"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    icon={IconQuote}
                    tooltip="Cita"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive('code')}
                    icon={IconCode}
                    tooltip="Código"
                />
                <EmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />
                <div className="w-px h-4 bg-white/5 mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                    icon={IconClearFormatting}
                    tooltip="Limpiar formato"
                />
                <div className="flex-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={IconArrowBackUp}
                    tooltip="Deshacer"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={IconArrowForwardUp}
                    tooltip="Rehacer"
                />
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

function MenuButton({ onClick, active, icon: Icon, tooltip }: { onClick: () => void, active?: boolean, icon: any, tooltip: string }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn(
                "size-8 rounded-lg transition-all",
                active ? "bg-blue-500/20 text-blue-400 group shadow-[0_0_10px_rgba(59,130,246,0.1)]" : "text-white/20 hover:text-white/60 hover:bg-white/5"
            )}
            title={tooltip}
        >
            <Icon className="size-4" />
        </Button>
    );
}
