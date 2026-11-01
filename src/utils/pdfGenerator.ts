import { jsPDF } from 'jspdf';
import { ExamSession, ContestConfig } from '../types/quiz';

function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} phut ${secs} giay`;
}

/**
 * 1. Generates an official Submission Confirmation Certificate PDF
 */
export function generateCandidateResultPDF(session: ExamSession, config: ContestConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Deep Cyan Frame
  doc.setDrawColor(14, 116, 144);
  doc.setLineWidth(1);
  doc.rect(12, 12, 186, 273);

  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.4);
  doc.rect(15, 15, 180, 267);

  // Corner decorations
  doc.setFillColor(14, 116, 144);
  doc.circle(15, 15, 1.5, 'F');
  doc.circle(195, 15, 1.5, 'F');
  doc.circle(15, 282, 1.5, 'F');
  doc.circle(195, 282, 1.5, 'F');

  // Header Left: Organization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('VIEN KIEM SAT NHAN DAN TOI CAO', 22, 26);
  doc.setFontSize(10.5);
  doc.setTextColor(185, 28, 28);
  doc.text('VKSND KHU VUC 3 - QUANG TRI', 22, 32);
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.4);
  doc.line(22, 34, 78, 34);

  // Header Right: Motto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 115, 26);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Doc lap - Tu do - Hanh phuc', 130, 32);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(125, 34, 175, 34);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(14, 116, 144);
  doc.text('GIAY XAC NHAN HOAN THANH BAI THI TRUC TUYEN', 105, 50, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('CUOC THI:', 105, 57, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text(`"${removeVietnameseTones(config.subTitle).toUpperCase()}"`, 105, 63, { align: 'center' });

  // Verification banner
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(25, 71, 160, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text(`Ma so xac thuc: ${session.certificateCode}  |  Ngay nop: ${session.submittedAt}`, 105, 77.5, { align: 'center' });

  // Candidate Information Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(22, 90, 166, 44, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(22, 90, 166, 44, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(14, 116, 144);
  doc.text('I. THONG TIN THI SINH', 28, 98);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Ho va ten thi sinh:', 28, 108);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(removeVietnameseTones(session.candidate.fullName).toUpperCase(), 75, 108);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Chuc danh, chuc vu:', 28, 118);
  doc.setFont('helvetica', 'normal');
  doc.text(removeVietnameseTones(session.candidate.position), 75, 118);

  doc.setFont('helvetica', 'bold');
  doc.text('Don vi cong tac:', 28, 126);
  doc.setFont('helvetica', 'normal');
  doc.text('Vien kiem sat nhan dan khu vuc 3 - Quang Tri', 75, 126);

  // Submission Details Box
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(22, 142, 166, 52, 2, 2, 'F');
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(22, 142, 166, 52, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(13, 148, 136);
  doc.text('II. XAC NHAN HOAN THANH BAI THI', 28, 150);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('- So cau hoi thi:', 28, 160);
  doc.setFont('helvetica', 'normal');
  doc.text(`${session.totalQuestions} cau trac nghiem`, 75, 160);

  doc.setFont('helvetica', 'bold');
  doc.text('- So cau da hoan thanh:', 28, 168);
  doc.setFont('helvetica', 'normal');
  const answeredCount = Object.keys(session.answers).length;
  doc.text(`${answeredCount} / ${session.totalQuestions} cau`, 75, 168);

  doc.setFont('helvetica', 'bold');
  doc.text('- Thoi gian lam bai:', 28, 176);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDuration(session.timeSpentSeconds), 75, 176);

  doc.setFont('helvetica', 'bold');
  doc.text('- Tinh trang luu tru:', 28, 184);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Da luu tru an toan trong Bo nho he thong Ban To chuc', 75, 184);

  // Security Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Du lieu bai thi da duoc ma hoa va luu tru vinh vien tai Bo nho he thong Ban To chuc.', 22, 204);
  doc.text('* Thi sinh su dung giay xac nhan nay de bao cao hoan thanh bai thi voi Thu ky cuoc thi.', 22, 209);

  // Signatures
  const signY = 222;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('THI SINH DU THI', 45, signY, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('(Ky va ghi ro ho ten)', 45, signY + 5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Quang Tri, ngay ..... thang ..... nam 2026', 150, signY - 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TM. BAN TO CHUC CUOC THI', 150, signY, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('(Xac thuc he thong)', 150, signY + 5, { align: 'center' });

  // Stamp
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.6);
  doc.roundedRect(125, signY + 12, 50, 24, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('VKSND KHU VUC 3', 150, signY + 19, { align: 'center' });
  doc.setFontSize(7);
  doc.text('DA LUU TRU BO NHO', 150, signY + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('BAN TO CHUC CUOC THI', 150, signY + 31, { align: 'center' });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(22, 272, 188, 272);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`He thong thi trac nghiem dien tu VKSND Khu vuc 3 - Quang Tri | Bo nho ID: ${session.certificateCode}`, 22, 276);

  const fileName = `Giay_xac_nhan_${removeVietnameseTones(session.candidate.fullName).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * 2. Generates Candidate Answer Sheet PDF (Tải file PDF câu trả lời)
 * Lists all questions with the candidate's chosen answer.
 */
export function generateCandidateAnswerSheetPDF(session: ExamSession, config: ContestConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPagesExp = '{total_pages_count_string}';

  // Header Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('VIEN KIEM SAT NHAN DAN TOI CAO', 20, 16);
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text('VKSND KHU VUC 3 - QUANG TRI', 20, 21);
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.3);
  doc.line(20, 23, 75, 23);

  // Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 120, 16);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Doc lap - Tu do - Hanh phuc', 133, 21);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(130, 23, 175, 23);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(14, 116, 144);
  doc.text('BANG CAU TRA LOI BAI THI TRAC NGHIEM TRUC TUYEN', 105, 33, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Cuoc thi: "${removeVietnameseTones(config.subTitle)}"`, 105, 39, { align: 'center' });

  // Candidate Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 43, 180, 18, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 43, 180, 18, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Thi sinh: ${removeVietnameseTones(session.candidate.fullName).toUpperCase()}`, 20, 49);
  doc.text(`Chuc danh, chuc vu: ${removeVietnameseTones(session.candidate.position)}`, 20, 56);

  doc.text(`Ma bai thi: ${session.certificateCode}`, 115, 49);
  doc.text(`Thoi gian nop: ${session.submittedAt}`, 115, 56);

  // Questions and Candidate Answers Table
  let y = 67;

  session.questions.forEach((q, idx) => {
    const selectedId = session.answers[q.displayIndex];
    const selectedOption = q.options.find((o) => o.id === selectedId);
    const chosenText = selectedOption ? `(${selectedOption.id}) ${removeVietnameseTones(selectedOption.text)}` : 'Chua tra loi';

    // Page overflow check
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.roundedRect(15, y - 4, 180, 12.5, 1, 1, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y - 4, 180, 12.5, 1, 1, 'D');

    // Question number & text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(14, 116, 144);
    doc.text(`Cau ${idx + 1}:`, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const splitQuestion = doc.splitTextToSize(removeVietnameseTones(q.question), 155);
    doc.text(splitQuestion[0] || '', 31, y);

    // Candidate's selected answer
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Lua chon cua thi sinh:', 18, y + 5);

    doc.setFont('helvetica', 'bold');
    if (selectedId) {
      doc.setTextColor(3, 105, 161); // Cyan-700
    } else {
      doc.setTextColor(239, 68, 68); // Red
    }
    const splitAnswer = doc.splitTextToSize(chosenText, 130);
    doc.text(splitAnswer[0] || '', 55, y + 5);

    y += 14.5;
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Bang cau tra loi cua thi sinh: ${removeVietnameseTones(session.candidate.fullName)} | Trang ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  const fileName = `File_PDF_cau_tra_loi_${removeVietnameseTones(session.candidate.fullName).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
