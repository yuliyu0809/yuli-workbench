import os
import queue
import threading
import traceback
from datetime import datetime
import tkinter as tk
from tkinter import filedialog, messagebox

import customtkinter as ctk

from analyzer import analyze_products, generate_wordcloud
from exporter import export_to_excel
from temu_scraper import TemuScraper


class TemuKeywordAssistantApp:
    STATUS_STYLES = {
        "ready": {"text": "\u5c31\u7eea", "bg": "#EEF7F1", "fg": "#2D8A4E"},
        "running": {"text": "\u8fd0\u884c\u4e2d", "bg": "#FFF2E8", "fg": "#CC5500"},
        "done": {"text": "\u5df2\u5b8c\u6210", "bg": "#E9F7EE", "fg": "#1F8A46"},
        "error": {"text": "\u51fa\u9519", "bg": "#FDECEC", "fg": "#C0392B"},
    }

    def __init__(self, root: ctk.CTk) -> None:
        self.root = root
        self.root.title("TEMU \u7206\u6b3e\u5173\u952e\u8bcd\u5206\u6790\u52a9\u624b")
        self.root.geometry("1100x780")
        self.root.minsize(980, 700)

        self.colors = {
            "page_bg": "#F4F6F8",
            "card_bg": "#FFFFFF",
            "card_border": "#E8EDF3",
            "text_primary": "#1F2937",
            "text_muted": "#6B7280",
            "accent": "#FF6A00",
            "accent_hover": "#E85F00",
            "log_bg": "#0C1322",
            "log_text": "#CFE3FF",
            "log_border": "#1E2A44",
        }

        ctk.set_appearance_mode("light")
        self.root.configure(fg_color=self.colors["page_bg"])

        self.log_queue: "queue.Queue[tuple[str, str]]" = queue.Queue()
        self.running = False

        self.keyword_var = tk.StringVar()
        self.output_var = tk.StringVar(value=self._default_output_path())
        self.headless_var = tk.BooleanVar(value=False)
        self.auto_open_var = tk.BooleanVar(value=True)

        self.status_badge: ctk.CTkLabel
        self.start_btn: ctk.CTkButton
        self.clear_log_btn: ctk.CTkButton
        self.open_last_btn: ctk.CTkButton
        self.log_text: ctk.CTkTextbox
        self.last_output_path: str = ""

        self._build_ui()
        self._set_status("ready")
        self.root.after(120, self._poll_messages)

    def _build_ui(self) -> None:
        main = ctk.CTkFrame(self.root, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=20, pady=16)

        self._build_header_card(main)
        self._build_input_card(main)
        self._build_action_card(main)
        self._build_log_card(main)

    def _build_header_card(self, parent) -> None:
        card = self._card(parent)
        card.pack(fill="x", pady=(0, 12))

        title = ctk.CTkLabel(
            card,
            text="TEMU \u7206\u6b3e\u5173\u952e\u8bcd\u5206\u6790\u52a9\u624b",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=26, weight="bold"),
            text_color=self.colors["text_primary"],
        )
        title.pack(anchor="w", padx=18, pady=(16, 4))

        subtitle = ctk.CTkLabel(
            card,
            text="\u8f93\u5165\u5173\u952e\u8bcd\u540e\u81ea\u52a8\u6293\u53d6TOP50\u5546\u54c1\uff0c\u8f93\u51fa\u5206\u6790\u62a5\u544a\u4e0e\u8bcd\u4e91",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13),
            text_color=self.colors["text_muted"],
        )
        subtitle.pack(anchor="w", padx=18, pady=(0, 16))

    def _build_input_card(self, parent) -> None:
        card = self._card(parent)
        card.pack(fill="x", pady=(0, 12))

        block_title = ctk.CTkLabel(
            card,
            text="\u8f93\u5165\u533a",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=16, weight="bold"),
            text_color=self.colors["text_primary"],
        )
        block_title.grid(row=0, column=0, columnspan=3, sticky="w", padx=18, pady=(14, 10))

        keyword_label = ctk.CTkLabel(
            card,
            text="\u4ea7\u54c1\u5173\u952e\u8bcd",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13, weight="bold"),
            text_color=self.colors["text_primary"],
        )
        keyword_label.grid(row=1, column=0, sticky="w", padx=(18, 10), pady=(0, 10))

        keyword_entry = ctk.CTkEntry(
            card,
            textvariable=self.keyword_var,
            height=38,
            corner_radius=10,
            border_color="#DCE4EE",
            fg_color="#FAFBFD",
            text_color=self.colors["text_primary"],
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13),
            placeholder_text="\u4f8b\u5982\uff1aled strip light / \u706f\u5e26 / \u6c1b\u56f4\u706f",
        )
        keyword_entry.grid(row=1, column=1, columnspan=2, sticky="ew", padx=(0, 18), pady=(0, 10))

        output_label = ctk.CTkLabel(
            card,
            text="Excel \u8f93\u51fa\u8def\u5f84",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13, weight="bold"),
            text_color=self.colors["text_primary"],
        )
        output_label.grid(row=2, column=0, sticky="w", padx=(18, 10), pady=(0, 10))

        output_entry = ctk.CTkEntry(
            card,
            textvariable=self.output_var,
            height=38,
            corner_radius=10,
            border_color="#DCE4EE",
            fg_color="#FAFBFD",
            text_color=self.colors["text_primary"],
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=12),
        )
        output_entry.grid(row=2, column=1, sticky="ew", padx=(0, 10), pady=(0, 10))

        browse_btn = ctk.CTkButton(
            card,
            text="\u9009\u62e9",
            width=90,
            height=36,
            corner_radius=12,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            text_color="#FFFFFF",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13, weight="bold"),
            command=self._pick_output_path,
        )
        browse_btn.grid(row=2, column=2, sticky="e", padx=(0, 18), pady=(0, 10))

        self.visual_check = ctk.CTkCheckBox(
            card,
            text="\u53ef\u89c6\u5316\u6d4f\u89c8\u5668\u6a21\u5f0f\uff08\u9996\u6b21\u767b\u5f55\u5efa\u8bae\u5f00\u542f\uff09",
            variable=self.headless_var,
            onvalue=True,
            offvalue=False,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            border_color="#C8D2DF",
            text_color=self.colors["text_primary"],
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=12),
        )
        self.visual_check.grid(row=3, column=0, columnspan=3, sticky="w", padx=18, pady=(0, 8))

        self.auto_open_check = ctk.CTkCheckBox(
            card,
            text="\u5206\u6790\u5b8c\u6210\u540e\u81ea\u52a8\u6253\u5f00 Excel",
            variable=self.auto_open_var,
            onvalue=True,
            offvalue=False,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            border_color="#C8D2DF",
            text_color=self.colors["text_primary"],
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=12),
        )
        self.auto_open_check.grid(row=4, column=0, columnspan=3, sticky="w", padx=18, pady=(0, 14))

        card.grid_columnconfigure(1, weight=1)

    def _build_action_card(self, parent) -> None:
        card = self._card(parent)
        card.pack(fill="x", pady=(0, 12))

        self.start_btn = ctk.CTkButton(
            card,
            text="\u5f00\u59cb\u5206\u6790",
            height=42,
            width=180,
            corner_radius=14,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            text_color="#FFFFFF",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=15, weight="bold"),
            command=self._start_analysis,
        )
        self.start_btn.pack(side="left", padx=18, pady=14)

        status_title = ctk.CTkLabel(
            card,
            text="\u5f53\u524d\u72b6\u6001",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13),
            text_color=self.colors["text_muted"],
        )
        status_title.pack(side="left", padx=(12, 8))

        self.status_badge = ctk.CTkLabel(
            card,
            text="",
            width=92,
            height=30,
            corner_radius=15,
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=12, weight="bold"),
        )
        self.status_badge.pack(side="left", pady=14)

        self.open_last_btn = ctk.CTkButton(
            card,
            text="\u6253\u5f00\u6700\u8fd1\u8f93\u51fa",
            height=36,
            width=140,
            corner_radius=12,
            fg_color="#FFFFFF",
            hover_color="#F4F6FA",
            text_color=self.colors["accent"],
            border_width=1,
            border_color="#FFD4B8",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13, weight="bold"),
            command=self._open_last_output,
            state="disabled",
        )
        self.open_last_btn.pack(side="right", padx=(8, 18), pady=14)

        self.clear_log_btn = ctk.CTkButton(
            card,
            text="\u6e05\u7a7a\u65e5\u5fd7",
            height=36,
            width=112,
            corner_radius=12,
            fg_color="#FFFFFF",
            hover_color="#F4F6FA",
            text_color="#4B5563",
            border_width=1,
            border_color="#D7DEE8",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=13, weight="bold"),
            command=self._clear_log,
        )
        self.clear_log_btn.pack(side="right", pady=14)

    def _build_log_card(self, parent) -> None:
        card = self._card(parent)
        card.pack(fill="both", expand=True)

        title = ctk.CTkLabel(
            card,
            text="\u8fd0\u884c\u65e5\u5fd7",
            font=ctk.CTkFont(family="Microsoft YaHei UI", size=15, weight="bold"),
            text_color=self.colors["text_primary"],
        )
        title.pack(anchor="w", padx=18, pady=(14, 8))

        self.log_text = ctk.CTkTextbox(
            card,
            corner_radius=12,
            fg_color=self.colors["log_bg"],
            border_width=1,
            border_color=self.colors["log_border"],
            text_color=self.colors["log_text"],
            font=ctk.CTkFont(family="Consolas", size=11),
            wrap="word",
        )
        self.log_text.pack(fill="both", expand=True, padx=18, pady=(0, 16))
        self.log_text.configure(state="disabled")

    def _card(self, parent) -> ctk.CTkFrame:
        return ctk.CTkFrame(
            parent,
            fg_color=self.colors["card_bg"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["card_border"],
        )

    def _set_status(self, key: str) -> None:
        style = self.STATUS_STYLES.get(key, self.STATUS_STYLES["ready"])
        self.status_badge.configure(
            text=style["text"],
            fg_color=style["bg"],
            text_color=style["fg"],
        )

    def _default_output_path(self) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return os.path.abspath(f"temu_keyword_report_{ts}.xlsx")

    def _pick_output_path(self) -> None:
        path = filedialog.asksaveasfilename(
            title="\u9009\u62e9 Excel \u8f93\u51fa\u6587\u4ef6",
            defaultextension=".xlsx",
            filetypes=[("Excel file", "*.xlsx")],
            initialfile=os.path.basename(self.output_var.get() or self._default_output_path()),
        )
        if path:
            self.output_var.set(path)

    def _start_analysis(self) -> None:
        if self.running:
            return

        keyword = self.keyword_var.get().strip()
        if not keyword:
            messagebox.showwarning("\u63d0\u793a", "\u8bf7\u8f93\u5165\u4ea7\u54c1\u5173\u952e\u8bcd\u3002")
            return

        output_path = self.output_var.get().strip()
        if not output_path:
            output_path = self._default_output_path()
            self.output_var.set(output_path)

        self.running = True
        self.start_btn.configure(state="disabled")
        self._set_status("running")
        self._append_log(f"Task started. Keyword: {keyword}")

        thread = threading.Thread(
            target=self._worker,
            args=(keyword, output_path, self.headless_var.get()),
            daemon=True,
        )
        thread.start()

    def _worker(self, keyword: str, output_path: str, visual_mode: bool) -> None:
        try:
            scraper = TemuScraper(headless=not visual_mode, max_items=50)
            products = scraper.scrape(keyword, progress=self._log_from_worker)

            if not products:
                raise RuntimeError("No product data was scraped. Try another keyword.")

            self._log_from_worker("Analyzing keywords and specs...")
            analysis = analyze_products(keyword, products)

            output_dir = os.path.dirname(os.path.abspath(output_path)) or os.getcwd()
            self._log_from_worker("Generating word cloud image...")
            wordcloud_path = generate_wordcloud(analysis.title_keywords, output_dir=output_dir)

            self._log_from_worker("Exporting Excel report...")
            final_path = export_to_excel(
                output_path=output_path,
                keyword=keyword,
                products=products,
                analysis=analysis,
                wordcloud_path=wordcloud_path,
            )

            self.log_queue.put(("done", final_path))
        except Exception as exc:
            detail = traceback.format_exc()
            self.log_queue.put(("error", f"{exc}\n{detail}"))

    def _log_from_worker(self, msg: str) -> None:
        self.log_queue.put(("log", msg))

    def _poll_messages(self) -> None:
        while not self.log_queue.empty():
            msg_type, msg = self.log_queue.get()
            if msg_type == "log":
                self._append_log(msg)
            elif msg_type == "done":
                self.running = False
                self.start_btn.configure(state="normal")
                self._set_status("done")
                self._append_log(f"Task completed. Report: {msg}")
                self.last_output_path = msg
                self.open_last_btn.configure(state="normal")
                messagebox.showinfo("\u5b8c\u6210", f"\u5206\u6790\u5df2\u5b8c\u6210\u3002\n\u8f93\u51fa\u6587\u4ef6:\n{msg}")
                if self.auto_open_var.get() and os.path.exists(msg):
                    try:
                        os.startfile(msg)  # type: ignore[attr-defined]
                    except Exception:
                        pass
            elif msg_type == "error":
                self.running = False
                self.start_btn.configure(state="normal")
                self._set_status("error")
                self._append_log("Task failed. See details below.")
                self._append_log(msg)
                messagebox.showerror("\u51fa\u9519", "\u6267\u884c\u5931\u8d25\uff0c\u8bf7\u67e5\u770b\u65e5\u5fd7\u3002")

        self.root.after(120, self._poll_messages)

    def _append_log(self, text: str) -> None:
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"[{ts}] {text}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _clear_log(self) -> None:
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", "end")
        self.log_text.configure(state="disabled")
        self._append_log("Log cleared.")

    def _open_last_output(self) -> None:
        if not self.last_output_path:
            messagebox.showwarning("\u63d0\u793a", "\u6682\u65e0\u6700\u8fd1\u8f93\u51fa\u6587\u4ef6\u3002")
            return
        if not os.path.exists(self.last_output_path):
            messagebox.showwarning("\u63d0\u793a", "\u6700\u8fd1\u8f93\u51fa\u6587\u4ef6\u4e0d\u5b58\u5728\u3002")
            self.open_last_btn.configure(state="disabled")
            return
        try:
            os.startfile(self.last_output_path)  # type: ignore[attr-defined]
        except Exception:
            messagebox.showerror("\u51fa\u9519", "\u6253\u5f00\u6587\u4ef6\u5931\u8d25\u3002")


def main() -> None:
    root = ctk.CTk()
    TemuKeywordAssistantApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
