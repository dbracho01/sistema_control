# -*- coding: utf-8 -*-
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from datetime import datetime
import os

class GeneradorReporteModelo:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.contador_reporte = self.obtener_ultimo_contador()
        
        # Estilos personalizados
        self.titulo_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=10,
            alignment=0,
            spaceAfter=2
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10
        )
        
    def obtener_ultimo_contador(self):
        archivo_contador = 'contador_reporte.txt'
        if os.path.exists(archivo_contador):
            with open(archivo_contador, 'r') as f:
                return int(f.read().strip())
        return 2003
        
    def guardar_contador(self):
        with open('contador_reporte.txt', 'w') as f:
            f.write(str(self.contador_reporte))
            
    def generar_reporte(self, datos, filename=None):
        
        # Incrementar contador
        self.contador_reporte += 1
        numero_reporte_principal = f"RS09-{self.contador_reporte:04d}"
        
        if filename is None:
            filename = f"reporte_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        os.makedirs('reportes_generados', exist_ok=True)
        filepath = os.path.join('reportes_generados', filename)
        
        # Configurar documento
        doc = SimpleDocTemplate(filepath, pagesize=A4,
                               topMargin=1*cm, bottomMargin=1*cm,
                               leftMargin=1.5*cm, rightMargin=1.5*cm)
        elementos = []
        
        # ----- ENCABEZADO SUPERIOR -----
        encabezado_data = [
            [numero_reporte_principal, "", "5.1 F01 Ver 2.0"]
        ]
        encabezado = Table(encabezado_data, colWidths=[100, 300, 100])
        encabezado.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, 0), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ]))
        elementos.append(encabezado)
        elementos.append(Spacer(1, 0.3*cm))
        
        # Fecha y hora
        fecha_data = [
            [f"FECHA: {datos['fecha']}", f"Horas: {datos['hora']}", f"Dias: {datos['dias']}"]
        ]
        fecha_tabla = Table(fecha_data, colWidths=[150, 100, 150])
        fecha_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ]))
        elementos.append(fecha_tabla)
        elementos.append(Spacer(1, 0.5*cm))
        
        # Título principal
        titulo_principal = Paragraph(
            f"<b>{datos['rs09_1854']} {datos['sistema']}</b>",
            self.titulo_style
        )
        elementos.append(titulo_principal)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ----- TABLA DE TIPO DE SERVICIO -----
        servicio_data = [
            ["INSTALACION", "MNTQ. PREVENTIVO", "MNTQ. CORRECTIVO", "Asesoría", "Consulta", "Otros"]
        ]
        servicio_tabla = Table(servicio_data, colWidths=[70, 70, 70, 50, 50, 50])
        servicio_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        elementos.append(servicio_tabla)
        
        # Valores de la tabla
        valores_servicio = [
            [
                "X" if datos['tabla_servicio']['instalacion'] else "",
                "X" if datos['tabla_servicio']['preventivo'] else "",
                "X" if datos['tabla_servicio']['correctivo'] else "",
                "X" if datos['tabla_servicio']['asesoria'] else "",
                "X" if datos['tabla_servicio']['consulta'] else "",
                "X" if datos['tabla_servicio']['otros'] else ""
            ]
        ]
        valores_tabla = Table(valores_servicio, colWidths=[70, 70, 70, 50, 50, 50])
        valores_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elementos.append(valores_tabla)
        elementos.append(Spacer(1, 0.2*cm))
        
        # Equipo nuevo/usado
        equipo_estado_data = [
            ["Equipo", "Nuevo", "Usado"]
        ]
        equipo_estado = Table(equipo_estado_data, colWidths=[80, 80, 80])
        equipo_estado.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, 0), colors.lightgrey),
        ]))
        elementos.append(equipo_estado)
        
        valores_estado = [
            [
                "",
                "X" if datos['equipo_nuevo'] else "",
                "X" if datos['equipo_usado'] else ""
            ]
        ]
        valores_estado_tabla = Table(valores_estado, colWidths=[80, 80, 80])
        valores_estado_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elementos.append(valores_estado_tabla)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ----- DATOS DE LA INSTITUCIÓN -----
        institucion_data = [
            [datos['institucion']],
            [f"Servicio {datos['servicio']} Responsable {datos['responsable']}"]
        ]
        institucion_tabla = Table(institucion_data, colWidths=[500])
        institucion_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elementos.append(institucion_tabla)
        elementos.append(Spacer(1, 0.1*cm))
        
        # Dirección
        direccion_data = [
            [f"Dirección {datos['direccion']} Ciudad {datos['ciudad']} Teléfono {datos['telefono']}"]
        ]
        direccion_tabla = Table(direccion_data, colWidths=[500])
        direccion_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elementos.append(direccion_tabla)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ----- DATOS DEL EQUIPO -----
        equipo_header = [["Equipo", "Marca", "Modelo", "Serie"]]
        equipo_header_tabla = Table(equipo_header, colWidths=[150, 100, 100, 100])
        equipo_header_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        elementos.append(equipo_header_tabla)
        
        equipo_data = [[
            datos['equipo']['nombre'],
            datos['equipo']['marca'],
            datos['equipo']['modelo'],
            datos['equipo']['serie']
        ]]
        equipo_data_tabla = Table(equipo_data, colWidths=[150, 100, 100, 100])
        equipo_data_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elementos.append(equipo_data_tabla)
        elementos.append(Spacer(1, 0.3*cm))
        
        # ----- COMENTARIOS Y DESCRIPCIÓN -----
        if datos['comentarios']:
            comentarios_data = [[f"Comentarios: {datos['comentarios']}"]]
            comentarios_tabla = Table(comentarios_data, colWidths=[500])
            comentarios_tabla.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ]))
            elementos.append(comentarios_tabla)
            elementos.append(Spacer(1, 0.2*cm))
        
        # Descripción del problema
        descripcion_data = [[f"Descripción del Problema / Falla:"]]
        descripcion_tabla = Table(descripcion_data, colWidths=[500])
        descripcion_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elementos.append(descripcion_tabla)
        
        descripcion_texto = Paragraph(datos['descripcion_problema'], self.normal_style)
        elementos.append(descripcion_texto)
        elementos.append(Spacer(1, 0.2*cm))
        
        # Accesorios
        accesorios_data = [[f"Accesorios y/o Partes:"]]
        accesorios_tabla = Table(accesorios_data, colWidths=[500])
        accesorios_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elementos.append(accesorios_tabla)
        
        accesorios_texto = Paragraph(datos['accesorios'] or "Ninguno", self.normal_style)
        elementos.append(accesorios_texto)
        elementos.append(Spacer(1, 0.2*cm))
        
        # Observaciones
        observaciones_data = [[f"Observaciones:"]]
        observaciones_tabla = Table(observaciones_data, colWidths=[500])
        observaciones_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elementos.append(observaciones_tabla)
        
        observaciones_texto = Paragraph(datos['observaciones'], self.normal_style)
        elementos.append(observaciones_texto)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ----- FIRMAS -----
        firmas_header = [
            ["Responsable técnico", "OPR (Cuando aplique)", "Responsable de la Institución"]
        ]
        firmas_header_tabla = Table(firmas_header, colWidths=[160, 160, 160])
        firmas_header_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        elementos.append(firmas_header_tabla)
        
        # Filas de firmas (3 filas para espacio)
        for i in range(3):
            fila_firma = [[
                datos['firmas']['responsable_tecnico'] if i == 2 else "",
                datos['firmas']['opr'] if i == 2 else "",
                datos['firmas']['institucion'] if i == 2 else ""
            ]]
            firma_tabla = Table(fila_firma, colWidths=[160, 160, 160])
            firma_tabla.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('HEIGHT', (0, 0), (-1, -1), 0.8*cm),
            ]))
            elementos.append(firma_tabla)
        
        # Nombres debajo
        nombres_data = [[
            datos['nombres']['responsable_tecnico'],
            datos['nombres']['opr'],
            datos['nombres']['institucion']
        ]]
        nombres_tabla = Table(nombres_data, colWidths=[160, 160, 160])
        nombres_tabla.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elementos.append(nombres_tabla)
        
        # Construir PDF
        doc.build(elementos)
        
        # Guardar contador
        self.guardar_contador()
        
        return filepath, numero_reporte_principal

# Función de prueba
if __name__ == "__main__":
    # Datos de ejemplo
    datos_ejemplo = {
        'fecha': '2026-02-13',
        'hora': '1',
        'dias': '1',
        'rs09_1854': 'RS09-1854',
        'sistema': 'SISTEMA DE TRANSFERENCIA SYMPHONY SN#VU-2629',
        'tabla_servicio': {
            'instalacion': False,
            'preventivo': True,
            'correctivo': False,
            'asesoria': False,
            'consulta': False,
            'otros': False
        },
        'equipo_nuevo': True,
        'equipo_usado': False,
        'institucion': 'Instituto Nacional de Cancerología E.S.E',
        'servicio': 'RADIOTERAPIA',
        'responsable': 'Sindy Peñaranda',
        'direccion': 'Calle 1 Nº 9-85',
        'ciudad': 'Bogotá',
        'telefono': '334 1111 - 334 0848',
        'equipo': {
            'nombre': 'Symphony Brachytherapy System - Lithotomy',
            'marca': 'QFIX',
            'modelo': '5100-500-A',
            'serie': 'VU-2629'
        },
        'comentarios': '',
        'descripcion_problema': 'Mantenimiento Preventivo Camilla Symphony',
        'accesorios': '',
        'observaciones': '''El día de hoy se realiza mantenimiento preventivo programado a la camilla Symphony ubicada en el area de radioterapia, se realiza el mantenimiento según protocolo del fabricante, se toma medida de voltaje 121 VAC, se realiza limpieza de la camilla, lubricación de ruedas de la camilla, verificación de movimientos, presentaba una falta de tornillo en la parte de las ruedas la cual afectaba movimientos laterales, esto se soluciona dentro del mantenimiento preventivo, se ve un desgaste en general por el uso, el accesorio de REF:RT-5100-05, con No de serie:8002990 se le debe cambiar la colchoneta inflable, por que ya no ejerce presión de la misma manera por desgaste general de uso, adicional queda pendiente el envío de la cotización del soporte lateral ya que sufrio un daño, este no afecta el funcionamiento de la misma.
Camilla queda operativa.

A su vez el se realiza la prueba de seguridad eléctrica a traves de la empresa SUITDORMEDICO.''',
        'firmas': {
            'responsable_tecnico': '',
            'opr': '',
            'institucion': ''
        },
        'nombres': {
            'responsable_tecnico': '',
            'opr': '',
            'institucion': ''
        }
    }
    
    generador = GeneradorReporteModelo()
    ruta, num_reporte = generador.generar_reporte(datos_ejemplo)
    print(f"✅ Reporte {num_reporte} generado: {ruta}")