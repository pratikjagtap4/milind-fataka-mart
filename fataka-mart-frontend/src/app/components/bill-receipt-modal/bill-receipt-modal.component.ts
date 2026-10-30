import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import { BillingPosService } from '../../core/services/billing-pos.service';
import { BillResponse } from '../../core/models/billing.models';

@Component({
  selector: 'app-bill-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (billingService.activeBill(); as bill) {
      <div 
        (click)="billingService.closeActiveBill()"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in cursor-pointer">
        <div 
          (click)="$event.stopPropagation()"
          class="relative w-full max-w-lg bg-white border border-amber-300 rounded-3xl shadow-2xl p-4 sm:p-6 my-6 text-slate-800 cursor-default">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🧾</span>
              <div>
                <h3 class="text-base font-extrabold text-slate-900">
                  Bill Receipt & WhatsApp JPG
                </h3>
                <p class="text-[11px] text-slate-500 font-medium">
                  Official customer invoice (Confidential margins strictly hidden)
                </p>
              </div>
            </div>
            <button 
              (click)="billingService.closeActiveBill()"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer font-bold">
              ✕
            </button>
          </div>

          <!-- NEW: UNSAVED CUSTOMER QUICK-ACTIONS -->
          <div class="mb-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="text-xs">
              <span class="font-bold text-slate-900 flex items-center gap-1.5">
                <span>📱</span> Customer: {{ bill.customerName }} ({{ bill.customerMobile }})
              </span>
              <p class="text-[11px] text-amber-900 mt-0.5">
                Unsaved contact? Save contact file or send directly without saving:
              </p>
            </div>
            
            <button 
              (click)="saveCustomerVcard(bill)"
              title="Save customer to phone contacts with 1 click"
              class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95">
              <span>👤</span> Add to Contacts (.vcf)
            </button>
          </div>

          <!-- Notification Toast / Status Info -->
          @if (shareNotification()) {
            <div class="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <span>💡</span>
              <span class="flex-1">{{ shareNotification() }}</span>
              <button (click)="shareNotification.set(null)" class="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
            </div>
          }

          <!-- THERMAL INVOICE CONTAINER (Rendered to JPG via html2canvas) -->
          <!-- STRICT SECURITY: NEVER SHOW PURCHASE PRICE OR OVERHEAD COST HERE! -->
          <div #thermalInvoice class="bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-sans border border-slate-200">
            
            <!-- Bill Header -->
            <div class="text-center pb-3 border-b border-dashed border-slate-300">
              <div class="text-2xl mb-1">🪔</div>
              <h2 class="text-lg font-black tracking-tight text-slate-900 uppercase">
                {{ bill.shopName }}
              </h2>
              <p class="text-[11px] text-slate-600">
                {{ bill.shopAddress }}, {{ bill.shopCity }}
              </p>
              <p class="text-[11px] font-semibold text-slate-800">
                📞 {{ bill.contactPhone }}
                @if (bill.gstNumber) {
                  <span> | GST: {{ bill.gstNumber }}</span>
                }
              </p>
            </div>

            <!-- Bill Meta -->
            <div class="py-2.5 border-b border-dashed border-slate-300 text-xs flex justify-between">
              <div>
                <p><strong>Bill No:</strong> <span class="font-mono">{{ bill.billNumber }}</span></p>
                <p><strong>Customer:</strong> {{ bill.customerName }}</p>
                <p><strong>Mobile:</strong> {{ bill.customerMobile }}</p>
              </div>
              <div class="text-right">
                <p><strong>Date:</strong> {{ bill.dateTime | date:'dd/MM/yyyy' }}</p>
                <p><strong>Time:</strong> {{ bill.dateTime | date:'hh:mm a' }}</p>
                <p><strong>Payment:</strong> {{ bill.paymentMethod }}</p>
              </div>
            </div>

            <!-- Item Table (Sanitized, Customer visible only) -->
            <div class="py-3 border-b border-dashed border-slate-300">
              <table class="w-full text-left text-[11px]">
                <thead>
                  <tr class="border-b border-slate-300 text-slate-600 font-bold">
                    <th class="py-1">Item</th>
                    <th class="py-1 text-center">Qty</th>
                    <th class="py-1 text-right">MRP</th>
                    <th class="py-1 text-right">Rate</th>
                    <th class="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (it of bill.items; track it.srNo) {
                    <tr>
                      <td class="py-1 font-semibold text-slate-900">
                        {{ it.productName }}
                      </td>
                      <td class="py-1 text-center">{{ it.quantity }}</td>
                      <td class="py-1 text-right text-slate-500">₹{{ it.sellingPrice.toFixed(0) }}</td>
                      <td class="py-1 text-right font-semibold">₹{{ it.finalRate.toFixed(2) }}</td>
                      <td class="py-1 text-right font-mono font-bold">₹{{ it.lineTotal.toFixed(2) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Summary Totals -->
            <div class="pt-3 space-y-1 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Total MRP:</span>
                <span class="font-mono">₹{{ bill.subtotalMrp.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-emerald-700 font-bold">
                <span>Diwali Savings:</span>
                <span class="font-mono">-₹{{ bill.totalSavingsAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Net Amount Paid:</span>
                <span class="font-mono text-base text-amber-700">₹{{ bill.finalAmount.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Festive Greeting -->
            <div class="mt-4 pt-3 border-t border-dashed border-slate-300 text-center">
              <p class="text-xs font-bold text-amber-700">
                🪔 {{ bill.festiveGreeting || 'Happy Diwali & Prosperous New Year!' }} 🪔
              </p>
              <p class="text-[10px] text-slate-500 mt-0.5">Wishing you & your family a joyous Diwali!</p>
            </div>

          </div>

          <!-- ACTION BUTTONS: WHATSAPP SHARE WITH JPG & TEXT, DOWNLOAD JPG -->
          <div class="mt-4 space-y-2.5">
            <!-- 1. DIRECT WHATSAPP TO CUSTOMER (Works for unsaved numbers!) -->
            <button 
              (click)="openDirectWhatsAppWithImagePrep(bill)"
              [disabled]="isSharing()"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer">
              @if (isSharing()) {
                <span class="animate-spin text-sm">⏳</span> Preparing JPG & Opening Chat...
              } @else {
                <span>💬</span> Open WhatsApp Chat with {{ bill.customerName }} (+91 {{ bill.customerMobile }})
              }
            </button>

            <!-- HELPFUL STEP-BY-STEP TIP FOR UNSAVED NUMBERS -->
            <div class="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-1.5">
              <div class="font-black flex items-center gap-1.5 text-amber-900">
                <span>💡</span> Sending JPG to Unsaved Contact in WhatsApp:
              </div>
              <p class="text-[11px] text-slate-700 leading-normal">
                WhatsApp's security policy requires 1 tap to attach images to new unsaved numbers.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div class="p-2 bg-white rounded-xl border border-amber-200">
                  <strong class="text-emerald-800 block mb-0.5">Method 1 (Instant):</strong>
                  Tap green button. JPG is copied to clipboard & gallery. In WhatsApp, tap 📎 $\rightarrow$ <strong>Gallery</strong> (or tap <strong>"Paste"</strong> on keyboard) to send!
                </div>
                <div class="p-2 bg-white rounded-xl border border-amber-200">
                  <strong class="text-blue-800 block mb-0.5">Method 2 (Direct Share):</strong>
                  Tap <strong>"👤 Add to Contacts"</strong> above to save {{ bill.customerName }} in 1 tap, then tap <strong>"📸 Share JPG"</strong> below to send image directly!
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2.5">
              <!-- 2. SHARE JPG BILL DIRECTLY (Web Share API to WhatsApp) -->
              <button 
                (click)="shareBillViaWebShare(bill)"
                [disabled]="isSharing()"
                class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer">
                @if (isSharing()) {
                  <span class="animate-spin text-sm">⏳</span> Preparing JPG...
                } @else {
                  <span>📸</span> Share JPG (Web Share)
                }
              </button>

              <!-- 3. DOWNLOAD JPG RECEIPT -->
              <button 
                (click)="downloadInvoiceJpg(bill)"
                class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                <span>📥</span> Download JPG Receipt
              </button>

              <!-- 4. PRINT / BROWSER PRINT -->
              <button 
                (click)="printInvoice()"
                class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>🖨️</span> Print
              </button>
            </div>

            <!-- 5. DONE / CLOSE PREVIEW BUTTON -->
            <button 
              (click)="billingService.closeActiveBill()"
              class="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
              ✕ Close Bill Preview
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class BillReceiptModalComponent {
  billingService = inject(BillingPosService);

  @ViewChild('thermalInvoice') thermalInvoiceElement!: ElementRef;

  readonly isSharing = signal<boolean>(false);
  readonly shareNotification = signal<string | null>(null);

  saveCustomerVcard(bill: BillResponse): void {
    const rawPhone = bill.customerMobile?.replace(/\D/g, '') || '';
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const vcardContent = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${bill.customerName}\r\nN:${bill.customerName};;;;\r\nTEL;TYPE=CELL,VOICE:+91${cleanPhone}\r\nORG:${bill.shopName}\r\nNOTE:Customer from ${bill.shopName}\r\nEND:VCARD\r\n`;

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${bill.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
    link.click();
    this.shareNotification.set(`👤 Contact card (.vcf) downloaded! Tap the file to add ${bill.customerName} directly to your phone contacts.`);
  }

  async copyImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        return new Promise<boolean>((resolve) => {
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                resolve(true);
              } catch (e) {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          }, 'image/png');
        });
      }
    } catch (e) {
      // Non-blocking clipboard fallback
    }
    return false;
  }

  async openDirectWhatsAppWithImagePrep(bill: BillResponse): Promise<void> {
    if (!this.thermalInvoiceElement) return;

    this.isSharing.set(true);

    try {
      // 1. Generate crisp high-resolution canvas
      const canvas = await html2canvas(this.thermalInvoiceElement.nativeElement, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      // 2. Download JPG invoice to gallery so it's ready in recent photos
      await this.downloadInvoiceJpg(bill, canvas);

      // 3. Copy PNG to device clipboard
      await this.copyImageToClipboard(canvas);

      // 4. Open WhatsApp directly to customer's unsaved mobile number
      this.openDirectWhatsApp(bill);

      // 5. Automatically close the bill preview popup after launching WhatsApp
      setTimeout(() => {
        this.billingService.closeActiveBill();
      }, 500);
    } catch (err) {
      this.openDirectWhatsApp(bill);
      setTimeout(() => {
        this.billingService.closeActiveBill();
      }, 500);
    } finally {
      this.isSharing.set(false);
    }
  }

  async shareBillViaWebShare(bill: BillResponse): Promise<void> {
    if (!this.thermalInvoiceElement) return;

    this.isSharing.set(true);
    this.shareNotification.set(null);

    try {
      // 1. Generate crisp high-resolution canvas
      const canvas = await html2canvas(this.thermalInvoiceElement.nativeElement, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const billNo = bill.billNumber || 'invoice';
      const shareText = `🪔 *${bill.shopName.toUpperCase()}* 🪔\n━━━━━━━━━━━━━━━━━━━━\n🧾 *Bill No:* ${bill.billNumber}\n👤 *Customer:* ${bill.customerName}\n💰 *Net Amount Paid:* ₹${bill.finalAmount.toFixed(2)}\n🎉 *Diwali Savings:* ₹${bill.totalSavingsAmount.toFixed(2)}\n━━━━━━━━━━━━━━━━━━━━\nThank you for shopping with us! 🪔 Have a safe & sparkling Diwali! 🎆`;

      // Copy text to clipboard so customer has complete record
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (clipErr) {
        // Non-blocking clipboard fallback
      }

      // Convert synchronously from dataURL to preserve user activation gesture in Android Chrome
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const file = this.dataURLtoFile(dataUrl, `${billNo}.jpg`);

      // 2. Check if Web Share API with Files is supported (Mobile Android Chrome / iOS Safari)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          // In WhatsApp Android, sharing files WITHOUT conflicting text avoids Android intent dropping the image
          await navigator.share({
            files: [file],
            title: `${bill.shopName} Bill - ${billNo}`
          });
          this.isSharing.set(false);
          // Auto-close modal after user finishes sharing
          this.billingService.closeActiveBill();
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            this.isSharing.set(false);
            return; // User simply closed the share sheet
          }
          console.log('Share error or cancelled, falling back to download', shareErr);
        }
      }

      // Fallback if file share unsupported on device / desktop: download JPG & launch WhatsApp
      this.downloadInvoiceJpg(bill, canvas);
      this.openDirectWhatsApp(bill);
      setTimeout(() => {
        this.billingService.closeActiveBill();
      }, 500);
    } catch (err) {
      console.error('Failed to generate image share', err);
      this.openDirectWhatsApp(bill);
      setTimeout(() => {
        this.billingService.closeActiveBill();
      }, 500);
    } finally {
      this.isSharing.set(false);
    }
  }

  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  async downloadInvoiceJpg(bill: BillResponse, existingCanvas?: HTMLCanvasElement): Promise<void> {
    try {
      const canvas = existingCanvas || await html2canvas(this.thermalInvoiceElement.nativeElement, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const billNo = bill.billNumber || 'receipt';
      const link = document.createElement('a');
      link.download = `${billNo}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Failed to download JPG invoice', err);
    }
  }

  openDirectWhatsApp(bill: BillResponse): void {
    const phone = bill.customerMobile?.replace(/\D/g, '') || '';
    const shareText = `🪔 *${bill.shopName.toUpperCase()}* 🪔\n━━━━━━━━━━━━━━━━━━━━\n🧾 *Bill No:* ${bill.billNumber}\n👤 *Customer:* ${bill.customerName}\n💰 *Net Amount Paid:* ₹${bill.finalAmount.toFixed(2)}\n🎉 *Diwali Savings:* ₹${bill.totalSavingsAmount.toFixed(2)}\n━━━━━━━━━━━━━━━━━━━━\nThank you for shopping with us! 🪔 Have a safe & sparkling Diwali! 🎆`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const cleanPhone = phone.length >= 10 ? phone.slice(-10) : phone;

    if (isMobile) {
      // whatsapp:// protocol invokes native mobile WhatsApp application INSTANTLY
      const appUrl = cleanPhone 
        ? `whatsapp://send?phone=91${cleanPhone}&text=${encodeURIComponent(shareText)}`
        : `whatsapp://send?text=${encodeURIComponent(shareText)}`;
      window.location.href = appUrl;
    } else {
      const webUrl = cleanPhone
        ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(shareText)}`
        : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(webUrl, '_blank');
    }
  }

  printInvoice(): void {
    window.print();
  }
}
