import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import styles from './ExportButtons.module.scss';

// Register Vietnamese fonts
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2',
      fontWeight: 700,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2',
      fontWeight: 800,
    },
  ],
});

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 800,
    color: '#ff4d30',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 11,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 3,
    textAlign: 'center',
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff4d30',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#212529',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },
  sectionBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionBoxOrange: {
    backgroundColor: '#fff5f3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#ff4d30',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#333333',
    width: 120,
  },
  infoValue: {
    fontSize: 11,
    color: '#333333',
    flex: 1,
  },
  highlightBox: {
    backgroundColor: '#ffe6e0',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#212529',
    width: 120,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 800,
    color: '#ff4d30',
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 25,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#ff4d30',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ff4d30',
    padding: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableCell: {
    fontSize: 10,
    color: '#333333',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  col1: { width: '20%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  col5: { width: '20%' },
  notesBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#ff4d30',
    marginBottom: 10,
  },
  noteItem: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  footerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ff4d30',
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 9,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
