import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

// 1. Generate PDF Project Report
export const generatePDFReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('owner', 'name email');
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ project: projectId }).populate('assignedUsers', 'name');

    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=project-report-${projectId}.pdf`);
    doc.pipe(res);

    // Document Title
    doc.fillColor('#4F46E5').fontSize(24).text('Project Status Report', { align: 'center' });
    doc.moveDown(1);
    
    // Project Metadata
    doc.fillColor('#1F2937').fontSize(14).text(`Project Title: ${project.title}`);
    doc.text(`Owner: ${project.owner?.name || 'Unassigned'}`);
    doc.text(`Priority: ${project.priority}`);
    doc.text(`Status: ${project.status}`);
    doc.text(`Budget: $${project.budget}`);
    doc.text(`Milestones: ${project.milestones.length} total`);
    doc.moveDown(2);

    // Tasks Heading
    doc.fillColor('#4F46E5').fontSize(18).text('Tasks Breakdown', { underline: true });
    doc.moveDown(0.5);

    // List Tasks
    tasks.forEach((task, index) => {
      doc.fillColor('#1F2937').fontSize(12).text(
        `${index + 1}. [${task.status}] ${task.title} - Priority: ${task.priority}`
      );
      const assignees = task.assignedUsers.map(u => u.name).join(', ') || 'Unassigned';
      doc.fillColor('#4B5563').fontSize(10).text(
        `   Assignees: ${assignees} | Story Points: ${task.storyPoints} | Tracked Time: ${task.actualTime}h / ${task.estimatedTime}h`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// 2. Generate Excel Task Export
export const generateExcelReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ project: projectId }).populate('assignedUsers', 'name email');

    // Build task row data
    const rows = tasks.map((task) => ({
      'Task Title': task.title,
      'Description': task.description || 'No Description',
      'Status': task.status,
      'Priority': task.priority,
      'Story Points': task.storyPoints,
      'Estimated Hours': task.estimatedTime,
      'Actual Tracked Hours': task.actualTime,
      'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
      'Assignees': task.assignedUsers.map(u => u.name).join(', ') || 'Unassigned',
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=project-tasks-${projectId}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
