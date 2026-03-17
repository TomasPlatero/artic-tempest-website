"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
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
    IconArrowForwardUp
} from '@tabler/icons-react';
import { cn } from '@/shared/tailwind/tailwind-utils';
import { Button } from './button';
import { useEffect } from 'react';
import { EmojiPicker } from '../components/emoji-picker';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline decoration-blue-500/30 hover:text-blue-300 transition-colors cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl border border-white/10 my-4 max-w-full h-auto',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Empieza a escribir...',
                emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-white/20 before:h-0 before:float-left before:pointer-events-none',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[160px] px-4 py-3 text-sm leading-relaxed text-zinc-200',
            },
        },
        immediatelyRender: false,
    });

    // Keep editor content in sync with external value if needed (mostly for clearing form)
    useEffect(() => {
        if (editor && value === "" && editor.getHTML() !== "") {
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
        <div className="w-full rounded-2xl border border-border/40 bg-muted/20 overflow-hidden focus-within:border-blue-500/50 transition-all">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-black/20 border-b border-border/20">
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
                <div className="w-px h-4 bg-white/10 mx-1" />
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
                <div className="w-px h-4 bg-white/10 mx-1" />
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
                <div className="w-px h-4 bg-white/10 mx-1" />
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
                active ? "bg-blue-500/20 text-blue-400 group" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
            title={tooltip}
        >
            <Icon className="size-4" />
        </Button>
    );
}
