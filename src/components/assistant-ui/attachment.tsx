import React, { useRef, useState } from 'react';
import { PaperclipIcon, ImageIcon, FileTextIcon, XIcon } from 'lucide-react';
import { TooltipIconButton } from './tooltip-icon-button';
import { Button } from '@/components/ui/button';

// Types for attachments
interface Attachment {
  id: string;
  name: string;
  type: string;
  file: File;
  url?: string; // For preview
}

// Component for displaying attachments in the composer
export const ComposerAttachments = () => {
  // We're using a global state for attachments in this demo
  const attachments = window.__ATTACHMENTS__ || [];
  if (attachments.length === 0) return null;

  return (
    <div className="w-full flex flex-wrap gap-2 my-2">
      {attachments.map((attachment: Attachment) => (
        <div 
          key={attachment.id} 
          className="flex items-center gap-2 py-1 px-3 rounded-full bg-muted/70 text-xs"
        >
          {attachment.type.startsWith('image/') ? (
            <ImageIcon className="h-3 w-3" />
          ) : (
            <FileTextIcon className="h-3 w-3" />
          )}
          <span className="truncate max-w-36">{attachment.name}</span>
          <button
            onClick={() => {
              window.__ATTACHMENTS__ = window.__ATTACHMENTS__.filter(
                (a: Attachment) => a.id !== attachment.id
              );
              // Force re-render
              window.dispatchEvent(new Event('attachment-updated'));
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Component for adding attachments in the composer
export const ComposerAddAttachment = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState({});

  // Initialize global attachments array if not exists
  if (typeof window !== 'undefined' && !window.__ATTACHMENTS__) {
    window.__ATTACHMENTS__ = [];
    window.addEventListener('attachment-updated', () => {
      forceUpdate({});
    });
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Add files to global attachments
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        file: file,
        url: URL.createObjectURL(file)
      };
      window.__ATTACHMENTS__ = window.__ATTACHMENTS__ || [];
      window.__ATTACHMENTS__.push(attachment);
    }
    
    // Force re-render
    forceUpdate({});
    
    // Reset input
    event.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileChange}
        accept="image/*,.txt,.pdf,.doc,.docx"
      />
      <TooltipIconButton
        tooltip="Add attachment"
        variant="ghost"
        className="my-2.5 h-8 w-8 p-2 transition-opacity ease-in"
        onClick={handleAttachmentClick}
      >
        <PaperclipIcon className="h-4 w-4" />
      </TooltipIconButton>
    </>
  );
};

// Component for displaying attachments in user messages
export const UserMessageAttachments = () => {
  // Since this is just for the UI demo, we'll show the same attachments
  const attachments = window.__ATTACHMENTS__ || [];
  if (attachments.length === 0) return null;
  
  return (
    <div className="w-full space-y-2">
      {attachments.map((attachment: Attachment) => (
        <AttachmentPreview key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
};

// Component for previewing attachments
interface AttachmentPreviewProps {
  attachment: Attachment;
}

const AttachmentPreview = ({ attachment }: AttachmentPreviewProps) => {
  if (!attachment) return null;

  if (attachment.type.startsWith('image/')) {
    return (
      <div className="rounded-lg overflow-hidden border border-border/40 mb-2 max-w-md">
        <img
          src={attachment.url || URL.createObjectURL(attachment.file)}
          alt={attachment.name}
          className="max-w-full h-auto"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/40 border border-border/20 mb-2 max-w-md">
      <FileTextIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{attachment.name}</span>
      <a
        href={attachment.url || URL.createObjectURL(attachment.file)}
        download={attachment.name}
        className="ml-auto"
      >
        <Button variant="ghost" size="sm">Download</Button>
      </a>
    </div>
  );
};

// Add type definition for global window object
declare global {
  interface Window {
    __ATTACHMENTS__: Attachment[];
  }
} 