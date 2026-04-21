import sys
import requests
from PyQt6.QtWidgets import *
from PyQt6.QtCore import Qt
from datetime import datetime

API_URL = "http://127.0.0.1:8000"

class CronogramaApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Cronograma de Equipos Médicos")
        self.setGeometry(200, 200, 1000, 600)
        
        # Widget central
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        
        # Formulario
        form = QGroupBox("Nuevo Equipo")
        form_layout = QFormLayout()
        
        self.equipo = QLineEdit()
        self.cliente = QLineEdit()
        self.ciudad = QLineEdit()
        self.serial = QLineEdit()
        self.garantia_inicio = QDateEdit()
        self.garantia_fin = QDateEdit()
        self.garantia_inicio.setDate(datetime.now().date())
        self.garantia_fin.setDate(datetime.now().date())
        self.mantenimiento_inicio = QDateEdit()
        self.mantenimiento_fin = QDateEdit()
        self.mantenimiento_inicio.setDate(datetime.now().date())
        self.mantenimiento_fin.setDate(datetime.now().date())
        self.observaciones = QTextEdit()
        
        form_layout.addRow("Equipo:", self.equipo)
        form_layout.addRow("Cliente:", self.cliente)
        form_layout.addRow("Ciudad:", self.ciudad)
        form_layout.addRow("Serial:", self.serial)
        form_layout.addRow("Garantía Inicio:", self.garantia_inicio)
        form_layout.addRow("Garantía Fin:", self.garantia_fin)
        form_layout.addRow("Mantenimiento Inicio:", self.mantenimiento_inicio)
        form_layout.addRow("Mantenimiento Fin:", self.mantenimiento_fin)
        form_layout.addRow("Observaciones:", self.observaciones)
        
        form.setLayout(form_layout)
        layout.addWidget(form)
        
        # Botones
        btn_layout = QHBoxLayout()
        btn_guardar = QPushButton("Guardar")
        btn_guardar.clicked.connect(self.guardar)
        btn_layout.addWidget(btn_guardar)
        layout.addLayout(btn_layout)
        
        # Tabla
        self.tabla = QTableWidget()
        self.tabla.setColumnCount(9)
        self.tabla.setHorizontalHeaderLabels([
            "ID", "Equipo", "Cliente", "Ciudad", "Serial", 
            "Garantía Inicio", "Garantía Fin", "Mantenimientos", "Observaciones"
        ])
        layout.addWidget(self.tabla)
        
        # Cargar datos
        self.cargar_datos()
    
    def guardar(self):
        data = {
            "equipo_medico": self.equipo.text(),
            "cliente": self.cliente.text(),
            "ciudad": self.ciudad.text(),
            "serial": self.serial.text(),
            "garantia_inicio": str(self.garantia_inicio.date().toPyDate()),
            "garantia_fin": str(self.garantia_fin.date().toPyDate()),
            "mantenimiento_inicio": str(self.mantenimiento_inicio.date().toPyDate()),
            "mantenimiento_fin": str(self.mantenimiento_fin.date().toPyDate()),
            "observaciones": self.observaciones.toPlainText()
        }
        
        try:
            r = requests.post(f"{API_URL}/equipos", json=data)
            if r.status_code == 200:
                QMessageBox.information(self, "Éxito", "Equipo guardado")
                self.cargar_datos()
            else:
                QMessageBox.warning(self, "Error", f"Error: {r.text}")
        except:
            QMessageBox.critical(self, "Error", "No se pudo conectar al servidor")
    
    def cargar_datos(self):
        try:
            r = requests.get(f"{API_URL}/equipos")
            if r.status_code == 200:
                datos = r.json()
                self.tabla.setRowCount(len(datos))
                for i, item in enumerate(datos):
                    self.tabla.setItem(i, 0, QTableWidgetItem(str(item.get('id', ''))))
                    self.tabla.setItem(i, 1, QTableWidgetItem(item.get('equipo_medico', '')))
                    self.tabla.setItem(i, 2, QTableWidgetItem(item.get('cliente', '')))
                    self.tabla.setItem(i, 3, QTableWidgetItem(item.get('ciudad', '')))
                    self.tabla.setItem(i, 4, QTableWidgetItem(item.get('serial', '')))
                    self.tabla.setItem(i, 5, QTableWidgetItem(item.get('garantia_inicio', '')))
                    self.tabla.setItem(i, 6, QTableWidgetItem(item.get('garantia_fin', '')))
                    self.tabla.setItem(i, 7, QTableWidgetItem(str(item.get('mantenimiento_inicio', ''))))
                    self.tabla.setItem(i, 8, QTableWidgetItem(item.get('observaciones', '')))
        except:
            QMessageBox.critical(self, "Error", "No se pudo conectar al servidor")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = CronogramaApp()
    window.show()
    sys.exit(app.exec())
