const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: './config/config.env' });
dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('./models/User');
const Project = require('./models/Project');
const Lead = require('./models/Lead');
const Task = require('./models/Task');
const Attendance = require('./models/Attendance');
const ChannelPartner = require('./models/ChannelPartner');
const Group = require('./models/Group');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');
const Plot = require('./models/Plot');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}), Project.deleteMany({}), Lead.deleteMany({}),
    Task.deleteMany({}), Attendance.deleteMany({}), ChannelPartner.deleteMany({}),
    Group.deleteMany({}), ActivityLog.deleteMany({}), Notification.deleteMany({}),
    Plot.deleteMany({}),
  ]);
  await User.collection.dropIndexes().catch(() => {});
  await ChannelPartner.collection.dropIndexes().catch(() => {});
  console.log('Cleared all collections');

  const pass = '12345678';

  const admin = await User.create({
    name: 'Admin User', initials: 'AU', role: 'admin',
    designation: 'System Administrator', email: 'admin@gmail.com',
    phone: '+91 98765 43210', avatarBg: 'bg-blue-500', isActive: true,
    password: pass,
  });

  const staff = await User.create({
    name: 'Staff User', initials: 'SU', role: 'staff',
    designation: 'Sales Executive', email: 'staff@gmail.com',
    phone: '+91 98765 43211', avatarBg: 'bg-emerald-500', isActive: true,
    password: pass,
  });

  const cp = await User.create({
    name: 'Channel Partner', initials: 'CP', role: 'partner',
    designation: 'Channel Partner', email: 'cp@gmail.com',
    phone: '+91 98765 43212', avatarBg: 'bg-purple-500', isActive: true,
    password: pass,
  });
  console.log('Created 3 users (admin, staff, partner)');

  await Group.create({ name: 'Sales Team', description: 'Primary sales team', members: [staff._id] });
  await Group.create({ name: 'Support Team', description: 'Customer support' });
  await User.findByIdAndUpdate(staff._id, { groupId: (await Group.findOne({ name: 'Sales Team' }))._id });
  console.log('Created 2 groups');

  const projects = await Project.create([
    { name: 'Green Valley Enclave', location: 'Hyderabad', description: 'Premium residential plots', status: 'Active', totalLandArea: 25, landAreaUnit: 'Acres', surveyNumber: 'HYD-2024-001', village: 'Gachibowli', mandal: 'Serilingampally', district: 'Ranga Reddy', landType: 'Residential', totalPlots: 48, plotSize: 200, plotSizeUnit: 'Sq Yards', roadFacingPlots: 8, cornerPlots: 6, category: 'Open Plots', isEnabled: true, latitude: '17.4483', longitude: '78.3741', owner: { name: 'Venkata Land Holdings', phone: '+91 98480 11022', email: 'legal@venkatalands.com' } },
    { name: 'Sunrise Township', location: 'Bengaluru', description: 'Large scale township', status: 'Active', totalLandArea: 80, landAreaUnit: 'Acres', surveyNumber: 'BLR-2024-012', village: 'Whitefield', mandal: 'Bangalore East', district: 'Bangalore Urban', landType: 'Mixed', totalPlots: 120, plotSize: 150, plotSizeUnit: 'Sq Yards', roadFacingPlots: 20, cornerPlots: 12, category: 'Apartments', isEnabled: true },
    { name: 'Royal Meadows', location: 'Chennai', description: 'Luxury villa plots', status: 'Upcoming', totalLandArea: 40, landAreaUnit: 'Acres', surveyNumber: 'CHE-2024-008', village: 'OMR', mandal: 'Sholinganallur', district: 'Chengalpattu', landType: 'Residential', totalPlots: 80, plotSize: 300, plotSizeUnit: 'Sq Yards', category: 'Open Plots', isEnabled: true },
    { name: 'Urban Heights', location: 'Pune', description: 'Commercial and residential', status: 'Active', totalLandArea: 18, landAreaUnit: 'Acres', surveyNumber: 'PUN-2024-005', village: 'Hinjewadi', mandal: 'Mulshi', district: 'Pune', landType: 'Commercial', totalPlots: 64, plotSize: 180, plotSizeUnit: 'Sq Yards', category: 'Commercial', isEnabled: true },
  ]);
  console.log(`Created ${projects.length} projects`);

  const facings = ['North', 'South', 'East', 'West', 'North East'];
  const plotDocs = [];
  for (const project of projects) {
    const isGreenValley = project.name === 'Green Valley Enclave';
    for (let i = 1; i <= project.totalPlots; i++) {
      plotDocs.push({
        projectId: project._id,
        plotNumber: i,
        status: isGreenValley && i <= 5 ? 'Booked' :
                isGreenValley && i <= 7 ? 'Registered' :
                isGreenValley && i === 8 ? 'Pending' : 'Available',
        facing: facings[i % 5],
        size: project.plotSize || 200,
        sizeUnit: project.plotSizeUnit || 'Sq Yards',
        type: ['Residential', 'Commercial'].includes(project.landType) ? project.landType : 'Residential',
        bookedBy: isGreenValley && i <= 7 ? { name: `Customer ${i}`, phone: `+91 9876500${i}`, paymentStatus: i <= 3 ? 'Fully Paid' : 'Partially Paid', type: 'customer' } : undefined,
      });
    }
    console.log(`Created ${project.totalPlots} plots for ${project.name}`);
  }
  await Plot.insertMany(plotDocs);

  const leadData = [
    { customerName: 'Suresh Patel', phone: '+91 98765 11111', email: 'suresh.patel@gmail.com', city: 'Hyderabad', status: 'Open', sourceType: 'Channel Partner', source: 'Channel Partner', dateAdded: '2025-05-20', dob: '1985-03-15' },
    { customerName: 'Kavitha Nair', phone: '+91 98765 22222', email: 'kavitha.n@yahoo.com', city: 'Bengaluru', status: 'Qualified', sourceType: 'Staff', source: 'Staff User', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-05-18', projectId: projects[1]._id, dob: '1990-07-22' },
    { customerName: 'Ramesh Babu', phone: '+91 98765 33333', email: 'ramesh.babu@outlook.com', city: 'Chennai', status: 'Open', sourceType: 'Direct', source: 'Direct Intake', dateAdded: '2025-05-25', dob: '1988-11-03' },
    { customerName: 'Deepa Menon', phone: '+91 98765 44444', email: 'deepa.menon@gmail.com', city: 'Pune', status: 'Customer', sourceType: 'Channel Partner', source: 'Channel Partner', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-04-10', projectId: projects[0]._id, paymentStatus: 'Fully Paid', dob: '1992-01-14' },
    { customerName: 'Arjun Reddy', phone: '+91 98765 55555', email: 'arjun.reddy@gmail.com', city: 'Hyderabad', status: 'Unqualified', sourceType: 'Staff', source: 'Staff User', dateAdded: '2025-05-05', dob: '1995-09-28' },
    { customerName: 'Lakshmi Devi', phone: '+91 98765 66666', email: 'lakshmi.devi@yahoo.com', city: 'Chennai', status: 'Open', sourceType: 'Channel Partner', source: 'Channel Partner', dateAdded: '2025-06-01', dob: '1987-12-05' },
    { customerName: 'Karthik Iyer', phone: '+91 98765 77777', email: 'karthik.i@gmail.com', city: 'Bengaluru', status: 'Qualified', sourceType: 'Staff', source: 'Staff User', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-05-28', projectId: projects[1]._id, dob: '1993-04-17' },
    { customerName: 'Meena Joshi', phone: '+91 98765 88888', email: 'meena.j@outlook.com', city: 'Pune', status: 'Open', sourceType: 'Direct', source: 'Direct Intake', dateAdded: '2025-06-02', dob: '1991-08-30' },
    
    // New Open Leads (Unassigned, for Open Leads Pool)
    { customerName: 'Vijay Kumar', phone: '+91 98765 99001', email: 'vijay.k@gmail.com', city: 'Hyderabad', status: 'Open', sourceType: 'Direct', source: 'Website', dateAdded: '2025-06-10', dob: '1984-05-12' },
    { customerName: 'Anitha Sharma', phone: '+91 98765 99002', email: 'anitha.s@gmail.com', city: 'Bengaluru', status: 'Open', sourceType: 'Channel Partner', source: 'CP Realty', dateAdded: '2025-06-12', dob: '1989-10-20' },
    { customerName: 'Rajesh Sen', phone: '+91 98765 99003', email: 'rajesh.s@yahoo.com', city: 'Kolkata', status: 'Open', sourceType: 'Direct', source: 'Walk-In', dateAdded: '2025-06-14', dob: '1982-08-15' },
    { customerName: 'Priya Dharshini', phone: '+91 98765 99004', email: 'priya.d@outlook.com', city: 'Chennai', status: 'Open', sourceType: 'Staff', source: 'Staff User', dateAdded: '2025-06-15', dob: '1991-02-28' },
    { customerName: 'Amit Verma', phone: '+91 98765 99005', email: 'amit.v@gmail.com', city: 'Pune', status: 'Open', sourceType: 'Direct', source: 'Social Media', dateAdded: '2025-06-18', dob: '1987-04-24' },
    { customerName: 'Sneha Reddy', phone: '+91 98765 99006', email: 'sneha.r@gmail.com', city: 'Hyderabad', status: 'Open', sourceType: 'Channel Partner', source: 'CP Realty', dateAdded: '2025-06-20', dob: '1993-11-08' },
    { customerName: 'Harish Rao', phone: '+91 98765 99007', email: 'harish.rao@yahoo.com', city: 'Hyderabad', status: 'Open', sourceType: 'Direct', source: 'Newspaper Ad', dateAdded: '2025-06-22', dob: '1980-06-30' },
    { customerName: 'Divya Teja', phone: '+91 98765 99008', email: 'divya.t@gmail.com', city: 'Bengaluru', status: 'Open', sourceType: 'Direct', source: 'Website', dateAdded: '2025-06-24', dob: '1995-07-18' },
    
    // Additional Assigned Leads
    { customerName: 'Sanjay Dutt', phone: '+91 98765 99009', email: 'sanjay.d@outlook.com', city: 'Mumbai', status: 'Qualified', sourceType: 'Staff', source: 'Staff User', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-06-11', projectId: projects[2]._id, dob: '1979-01-25' },
    { customerName: 'Nisha Gupta', phone: '+91 98765 99010', email: 'nisha.g@gmail.com', city: 'Delhi', status: 'Qualified', sourceType: 'Channel Partner', source: 'CP Realty', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-06-15', projectId: projects[3]._id, dob: '1992-09-04' },
    { customerName: 'Manoj Bajpayee', phone: '+91 98765 99011', email: 'manoj.b@gmail.com', city: 'Patna', status: 'Customer', sourceType: 'Direct', source: 'Walk-In', assignedTo: staff._id, assignedToName: 'Staff User', dateAdded: '2025-05-10', projectId: projects[0]._id, paymentStatus: 'Partially Paid', dob: '1975-04-23' }
  ];
  const createdLeads = await Lead.insertMany(leadData);
  console.log(`Created ${createdLeads.length} leads`);

  await Task.insertMany([
    { title: 'Follow up with Suresh Patel', description: 'Call to schedule site visit', status: 'To Do', priority: 'High', assignee: staff._id, assigneeInitials: 'SU', dueDate: new Date('2025-06-05'), project: projects[0]._id },
    { title: 'Send brochure to Kavitha', description: 'Email project brochure', status: 'In Progress', priority: 'Medium', assignee: staff._id, assigneeInitials: 'SU', dueDate: new Date('2025-06-04'), project: projects[1]._id },
    { title: 'Prepare quarterly sales report', description: 'Compile Q2 sales data', status: 'To Do', priority: 'Medium', assignee: staff._id, assigneeInitials: 'SU', dueDate: new Date('2025-06-10') },
    { title: 'Update plot availability', description: 'Mark sold plots in system', status: 'Done', priority: 'Low', assignee: staff._id, assigneeInitials: 'SU', dueDate: new Date('2025-05-28'), project: projects[0]._id },
  ]);
  console.log('Created 4 tasks');

  await ChannelPartner.create([
    { userId: cp._id, name: 'Channel Partner', companyName: 'CP Realty', phone: '+91 98765 43301', email: 'cp@gmail.com', city: 'Hyderabad', reraId: 'RERA-TS-001', totalLeads: 3, isActive: true, initials: 'CP', avatarBg: 'bg-purple-500' },
  ]);
  console.log('Created 1 channel partner');

  const today = new Date().toISOString().split('T')[0];
  await Attendance.insertMany([
    { staffId: staff._id, staffName: 'Staff User', date: today, checkIn: '09:02 AM', status: 'Present', role: 'staff' },
  ]);
  console.log('Created attendance records');

  await ActivityLog.insertMany([
    { actorId: admin._id, actorName: 'Admin User', actorRole: 'Admin', actorInitials: 'AU', actorAvatarBg: 'bg-blue-500', action: 'Created project Green Valley Enclave', actionType: 'Created', entityType: 'Project', entityId: projects[0]._id, entityName: 'Green Valley Enclave', timestamp: new Date().toISOString() },
    { actorId: staff._id, actorName: 'Staff User', actorRole: 'Staff', actorInitials: 'SU', actorAvatarBg: 'bg-emerald-500', action: 'Qualified lead Kavitha Nair', actionType: 'Status Change', entityType: 'Lead', entityId: createdLeads[1]._id, entityName: 'Kavitha Nair', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { actorId: staff._id, actorName: 'Staff User', actorRole: 'Staff', actorInitials: 'SU', actorAvatarBg: 'bg-emerald-500', action: 'Updated lead Ramesh Babu notes', actionType: 'Updated', entityType: 'Lead', entityId: createdLeads[2]._id, entityName: 'Ramesh Babu', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ]);
  console.log('Created activity logs');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nCredentials (password for all): 12345678');
  console.log('  Admin:   admin@gmail.com');
  console.log('  Staff:   staff@gmail.com');
  console.log('  Partner: cp@gmail.com');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
