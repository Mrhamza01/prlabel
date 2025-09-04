import express from 'express';
import axios from 'axios';
import pkg from 'pdf-to-printer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import getPrintersManual from './test.js';

const { print } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔑 Your ShipStation API key
const API_KEY = 'JILBDAG+l4sbNKSl5+8PihQkIiZQXqDFjDe5aMfXeuw';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UI page
app.get('/', (req, res) => {
  res.render('index', { error: null, success: null });
});

// ✅ Get connected printers
app.get('/printers', async (req, res) => {
  try {
    const printers = await getPrintersManual();
    console.log('✅ Printers fetched:', printers);
    res.json({ printers });
  } catch (err) {
    console.error('❌ Printer list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// ✅ Get default printers
app.get('/printers/default', async (req, res) => {
  try {
    const defaultPrinter = await getPrintersManual();
    console.log(defaultPrinter)
    res.json({ defaultPrinter });
  } catch (err) {
    console.error('❌ Default printer error:', err.message);
    res.status(500).json({ error: 'Failed to fetch default printer' });
  }
});

// Handle printing by fetching label from ShipStation
app.post('/print', async (req, res) => {
  // const { shipmentId } = req.body;
  const shipmentId = 'se-939039759';

  if (!shipmentId) {
    return res.render('index', {
      error: '❌ shipmentId is required',
      success: null,
    });
  }
  try {
    console.log('📦 Fetching label for shipment:', shipmentId);

    const response = await axios.get(`https://api.shipstation.com/v2/labels/`, {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      params: {
        shipment_id: shipmentId,
      },
    });

    const labelData = response.data;
    const label = labelData?.labels?.[0];
    const pdfUrl = label?.label_download?.pdf;

    if (!pdfUrl) {
      throw new Error('❌ No PDF URL found for this shipment');
    }

    console.log('✅ PDF URL:', pdfUrl);

    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
    });
    const filePath = path.join(__dirname, `${shipmentId}-label.pdf`);
    await fs.writeFile(filePath, pdfResponse.data);

    // Print the label
    await print(filePath);

    console.log('🖨️ Print job sent successfully');
    res.render('index', {
      success: '✅ Label printed successfully!',
      error: null,
    });
  } catch (err) {
    console.error('❌ Print error:', err.response?.data || err.message);
    res.render('index', { error: err.message, success: null });
  }
});


app.post('/generate-and-print', async (req, res) => {
  // const { shipmentId } = req.body;
  const shipmentId = 'se-939039759';

  if (!shipmentId) {
    return res.render('index', {
      error: '❌ shipmentId is required',
      success: null,
    });
  }
  try {
    console.log('📦 Fetching label for shipment:', shipmentId);

    const response = await axios.post(`https://api.shipstation.com/v2/labels/`, {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        shipment_id: shipmentId,
      },
    });

    const labelData = response.data;
    const label = labelData?.labels?.[0];
    const pdfUrl = label?.label_download?.pdf;

    if (!pdfUrl) {
      throw new Error('❌ No PDF URL found for this shipment');
    }

    console.log('✅ PDF URL:', pdfUrl);

    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
    });
    const filePath = path.join(__dirname, `${shipmentId}-label.pdf`);
    await fs.writeFile(filePath, pdfResponse.data);

    // Print the label
    await print(filePath);

    console.log('🖨️ Print job sent successfully');
    res.render('index', {
      success: '✅ Label printed successfully!',
      error: null,
    });
  } catch (err) {
    console.error('❌ Print error:', err.response?.data || err.message);
    res.render('index', { error: err.message, success: null });
  }
});

app.listen(4000, () => {
  console.log('🖨️ Printer service running at http://localhost:4000');
});
