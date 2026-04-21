import tkinter as tk
from tkinter import ttk, messagebox
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000"

class App:
    def __init__(self, root):
        self.root = root
        root.title("Cronograma de Equipos Médicos")
        root.geometry("1000x600")
        
        # Formulario
        frame = ttk.LabelFrame(root, text="Nuevo Equipo", padding=10)
        frame.pack(fill="x", padx=10, pady=5)
        
        campos = [
            ("Equipo:", "equipo"),
            ("Cliente:", "cliente"),
            ("Ciudad:", "ciudad"),
            ("Serial:", "serial"),
            ("Garantía Inicio (YYYY-MM-DD):", "g_inicio"),
            ("Garantía Fin (YYYY-MM-DD):", "g_fin"),
        ]
        
        self.entries = {}
        for i, (label, key) in enumerate(campos):
            ttk.Label(frame, text=label).grid(row=i, column=0, sticky="w", pady=2)
            entry = ttk.Entry(frame, width=30)
            entry.grid(row=i, column=1, padx=5, pady=2)
            self.entries[key] = entry
        
        # Observaciones
        ttk.Label(frame, text="Observaciones:").grid(row=6, column=0, sticky="w", pady=2)
        self.obs = tk.Text(frame, height=3, width=30)
        self.obs.grid(row=6, column=1, padx=5, pady=2)
        
        # Botones
        btn_frame = ttk.Frame(frame)
        btn_frame.grid(row=7, column=0, columnspan=2, pady=10)
        
        ttk.Button(btn_frame, text="Guardar", command=self.guardar).pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Actualizar", command=self.cargar_datos).pack(side="left", padx=5)
        
        # Tabla
        columns = ("ID", "Equipo", "Cliente", "Ciudad", "Serial", "Garantía Inicio", "Garantía Fin", "Obs")
        self.tree = ttk.Treeview(root, columns=columns, show="headings", height=15)
        
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100)
        
        scrollbar = ttk.Scrollbar(root, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(fill="both", expand=True, padx=10, pady=5)
        scrollbar.pack(side="right", fill="y")
        
        # Cargar datos iniciales
        self.cargar_datos()
    
    def guardar(self):
        data = {
            "equipo_medico": self.entries["equipo"].get(),
            "cliente": self.entries["cliente"].get(),
            "ciudad": self.entries["ciudad"].get(),
            "serial": self.entries["serial"].get(),
            "garantia_inicio": self.entries["g_inicio"].get(),
            "garantia_fin": self.entries["g_fin"].get(),
            "mantenimiento_inicio": None,
            "mantenimiento_fin": None,
            "observaciones": self.obs.get("1.0", tk.END).strip()
        }
        
        try:
            r = requests.post(f"{API_URL}/equipos", json=data)
            if r.status_code == 200:
                messagebox.showinfo("Éxito", "Equipo guardado")
                self.cargar_datos()
            else:
                messagebox.showerror("Error", f"Error: {r.text}")
        except:
            messagebox.showerror("Error", "No se pudo conectar al servidor")
    
    def cargar_datos(self):
        try:
            r = requests.get(f"{API_URL}/equipos")
            if r.status_code == 200:
                datos = r.json()
                for row in self.tree.get_children():
                    self.tree.delete(row)
                for item in datos:
                    self.tree.insert("", "end", values=(
                        item.get('id', ''),
                        item.get('equipo_medico', ''),
                        item.get('cliente', ''),
                        item.get('ciudad', ''),
                        item.get('serial', ''),
                        item.get('garantia_inicio', ''),
                        item.get('garantia_fin', ''),
                        item.get('observaciones', '')[:20] + "..."
                    ))
        except:
            messagebox.showerror("Error", "No se pudo conectar al servidor")

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
