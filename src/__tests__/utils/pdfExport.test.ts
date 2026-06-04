import { exportMedicalRecord, exportOrderList, exportHandover, exportConsult } from '../../utils/pdfExport';

describe('pdfExport', () => {
  let mockOpen: jest.Mock;
  let mockWrite: jest.Mock;
  let mockClose: jest.Mock;
  let mockPrint: jest.Mock;

  beforeEach(() => {
    mockWrite = jest.fn();
    mockClose = jest.fn();
    mockPrint = jest.fn();
    mockOpen = jest.fn().mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      print: mockPrint,
    });
    window.open = mockOpen;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('exportMedicalRecord', () => {
    it('should open a print window', () => {
      exportMedicalRecord('<p>病历内容</p>', '张建国');
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should write HTML to the window', () => {
      exportMedicalRecord('<p>病历内容</p>', '张建国');
      expect(mockWrite).toHaveBeenCalled();
      const html = mockWrite.mock.calls[0][0];
      expect(html).toContain('张建国');
      expect(html).toContain('住院病历');
    });

    it('should call print after delay', () => {
      exportMedicalRecord('<p>病历内容</p>', '张建国');
      expect(mockPrint).not.toHaveBeenCalled();
      jest.advanceTimersByTime(600);
      expect(mockPrint).toHaveBeenCalled();
    });

    it('should alert if window cannot be opened', () => {
      const mockAlert = jest.fn();
      window.alert = mockAlert;
      mockOpen.mockReturnValue(null);
      
      exportMedicalRecord('<p>病历内容</p>', '张建国');
      expect(mockAlert).toHaveBeenCalledWith('无法打开打印窗口，请检查浏览器设置');
    });
  });

  describe('exportOrderList', () => {
    it('should open a print window', () => {
      exportOrderList([{ name: '药1', detail: '详情' }], '张建国');
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should include orders in HTML', () => {
      exportOrderList([{ name: '阿司匹林', detail: '抗血小板' }], '张建国');
      const html = mockWrite.mock.calls[0][0];
      expect(html).toContain('阿司匹林');
      expect(html).toContain('抗血小板');
      expect(html).toContain('医嘱单');
    });
  });

  describe('exportHandover', () => {
    it('should open a print window', () => {
      exportHandover('<p>交班内容</p>', '张建国');
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should include handover content', () => {
      exportHandover('<p>交班内容</p>', '张建国');
      const html = mockWrite.mock.calls[0][0];
      expect(html).toContain('交班摘要');
      expect(html).toContain('张建国');
    });
  });

  describe('exportConsult', () => {
    it('should open a print window', () => {
      exportConsult([{ dept: '心内科', content: '建议' }], '张建国');
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should include consult data', () => {
      exportConsult([{ dept: '心内科', content: '建议溶栓' }], '张建国');
      const html = mockWrite.mock.calls[0][0];
      expect(html).toContain('心内科');
      expect(html).toContain('建议溶栓');
      expect(html).toContain('多学科联合会诊意见');
    });
  });
});
