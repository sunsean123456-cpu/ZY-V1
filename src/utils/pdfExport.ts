/**
 * PDF 导出工具 - 医疗文书导出
 */

/**
 * 导出病历为 PDF
 */
export function exportMedicalRecord(content: string, patientName: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('无法打开打印窗口，请检查浏览器设置');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>入院病历 - ${patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 14px;
      line-height: 1.8;
      padding: 40px;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    h2 {
      font-size: 16px;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin: 16px 0 8px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    .section {
      margin-bottom: 12px;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .content {
      text-indent: 2em;
      font-size: 13px;
    }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signature {
      margin-top: 30px;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 2cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>住院病历</h1>
  <div class="header-info">
    <div>患者姓名：${patientName}</div>
    <div>记录时间：${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <div class="content">${content}</div>
  <div class="footer">
    <div class="signature">记录医师：___________</div>
    <div class="signature">审核医师：___________</div>
  </div>
</body>
</html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * 导出医嘱单为 PDF
 */
export function exportOrderList(
  orders: { name: string; detail: string }[],
  patientName: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('无法打开打印窗口，请检查浏览器设置');
    return;
  }

  const ordersHtml = orders
    .map(
      (o, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${o.name}</td>
      <td>${o.detail}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>医嘱单 - ${patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 14px;
      line-height: 1.6;
      padding: 40px;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-size: 13px;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signature {
      margin-top: 30px;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 2cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>医嘱单</h1>
  <div class="header-info">
    <div>患者姓名：${patientName}</div>
    <div>开单时间：${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th width="50">序号</th>
        <th width="200">项目名称</th>
        <th>详细内容</th>
      </tr>
    </thead>
    <tbody>
      ${ordersHtml}
    </tbody>
  </table>
  <div class="footer">
    <div class="signature">开单医师：___________</div>
    <div class="signature">审核医师：___________</div>
  </div>
</body>
</html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * 导出交班摘要为 PDF
 */
export function exportHandover(content: string, patientName: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('无法打开打印窗口，请检查浏览器设置');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>交班摘要 - ${patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 14px;
      line-height: 1.8;
      padding: 40px;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    .content {
      text-indent: 2em;
      font-size: 13px;
      margin-top: 16px;
    }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signature {
      margin-top: 30px;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 2cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>交班摘要</h1>
  <div class="header-info">
    <div>患者姓名：${patientName}</div>
    <div>交班时间：${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <div class="content">${content}</div>
  <div class="footer">
    <div class="signature">交班医师：___________</div>
    <div class="signature">接班医师：___________</div>
  </div>
</body>
</html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * 导出会诊意见为 PDF
 */
export function exportConsult(
  consults: { dept: string; content: string }[],
  patientName: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('无法打开打印窗口，请检查浏览器设置');
    return;
  }

  const consultsHtml = consults
    .map(
      (c) => `
    <div class="consult-item">
      <div class="dept"><strong>${c.dept}</strong></div>
      <div class="consult-content">${c.content}</div>
    </div>
  `
    )
    .join('');

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>会诊意见 - ${patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 14px;
      line-height: 1.8;
      padding: 40px;
      color: #000;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    .consult-item {
      margin-bottom: 20px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .dept {
      font-size: 15px;
      margin-bottom: 8px;
      color: #2563eb;
    }
    .consult-content {
      font-size: 13px;
      text-indent: 2em;
    }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signature {
      margin-top: 30px;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 2cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>多学科联合会诊意见</h1>
  <div class="header-info">
    <div>患者姓名：${patientName}</div>
    <div>会诊时间：${new Date().toLocaleString('zh-CN')}</div>
  </div>
  ${consultsHtml}
  <div class="footer">
    <div class="signature">主管医师：___________</div>
    <div class="signature">会诊医师：___________</div>
  </div>
</body>
</html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
