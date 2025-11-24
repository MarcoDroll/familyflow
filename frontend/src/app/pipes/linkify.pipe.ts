import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null): SafeHtml {
    if (!text) {
      return '';
    }

    // URL regex pattern - matches http, https, and www URLs
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s<>"\'\)]+)/gi;

    // Escape HTML entities first to prevent XSS
    const escaped = this.escapeHtml(text);

    // Replace URLs with anchor tags
    const linked = escaped.replace(urlPattern, (url) => {
      let href = url;
      // Add https:// if URL starts with www.
      if (url.toLowerCase().startsWith('www.')) {
        href = 'https://' + url;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${url}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(linked);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
