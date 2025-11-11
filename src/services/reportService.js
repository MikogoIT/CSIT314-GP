// 真实数据报告服务
// src/services/reportService.js

import { DataService } from './dataService';

export class ReportService {
  // 获取指定日期范围的数据
  static getDateRangeData(startDate, endDate, requests, users) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredRequests = requests.filter(request => {
      const date = new Date(request.createdAt);
      return date >= start && date <= end;
    });
    
    const filteredUsers = users.filter(user => {
      const date = new Date(user.registeredAt || user.createdAt);
      return date >= start && date <= end;
    });
    
    return { requests: filteredRequests, users: filteredUsers };
  }
  
  // 生成日报数据
  static async generateDailyReport(targetDate = new Date()) {
    const users = await DataService.getUsers();
    const requests = await DataService.getRequests();
    
    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { requests: todayRequests, users: todayUsers } = this.getDateRangeData(
      today.toISOString(),
      tomorrow.toISOString(),
      requests,
      users
    );
    
    // 计算昨天的数据用于对比
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const { requests: yesterdayRequests, users: yesterdayUsers } = this.getDateRangeData(
      yesterday.toISOString(),
      today.toISOString(),
      requests,
      users
    );
    
    const todayMatched = todayRequests.filter(r => r.status === 'matched').length;
    const yesterdayMatched = yesterdayRequests.filter(r => r.status === 'matched').length;
    
    const matchGrowth = yesterdayMatched === 0 ? (todayMatched > 0 ? 100 : 0) : 
      Math.round(((todayMatched - yesterdayMatched) / yesterdayMatched) * 100);
    
    const userGrowth = yesterdayUsers.length === 0 ? (todayUsers.length > 0 ? 100 : 0) :
      Math.round(((todayUsers.length - yesterdayUsers.length) / yesterdayUsers.length) * 100);
    
    const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'matched').length;
    
    // 计算完成率
    const completedToday = todayRequests.filter(r => r.status === 'completed').length;
    const totalProcessedToday = todayRequests.filter(r => r.status !== 'pending').length;
    const completionRate = totalProcessedToday === 0 ? 0 : 
      Math.round((completedToday / totalProcessedToday) * 100);
    
    return {
      reportType: 'daily',
      date: today.toISOString().split('T')[0],
      totalMatches: todayMatched,
      newUsers: todayUsers.length,
      activeRequests: activeRequests,
      completionRate: `${completionRate}%`,
      trends: {
        matchGrowth: matchGrowth,
        userGrowth: userGrowth,
        completionRateChange: 0
      },
      details: {
        categoryBreakdown: await this.getCategoryBreakdown(todayRequests),
        hourlyActivity: this.getHourlyActivity(todayRequests),
        userTypeBreakdown: this.getUserTypeBreakdown(todayUsers)
      }
    };
  }
  
  // 生成周报数据
  static async generateWeeklyReport(targetDate = new Date()) {
    const users = await DataService.getUsers();
    const requests = await DataService.getRequests();
    
    // 计算包含目标日期的那一周（周一到周日）
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    // 调整到周一（如果周日是0，则调整为-6，否则调整为1-dayOfWeek）
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(date.getDate() + daysToMonday);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    const { requests: weekRequests, users: weekUsers } = this.getDateRangeData(
      startDate.toISOString(),
      endDate.toISOString(),
      requests,
      users
    );
    
    // 计算上周数据用于对比
    const lastWeekEnd = new Date(startDate);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const { requests: lastWeekRequests, users: lastWeekUsers } = this.getDateRangeData(
      lastWeekStart.toISOString(),
      lastWeekEnd.toISOString(),
      requests,
      users
    );
    
    const weekMatched = weekRequests.filter(r => r.status === 'matched').length;
    const lastWeekMatched = lastWeekRequests.filter(r => r.status === 'matched').length;
    
    const matchGrowth = lastWeekMatched === 0 ? (weekMatched > 0 ? 100 : 0) : 
      Math.round(((weekMatched - lastWeekMatched) / lastWeekMatched) * 100);
    
    const userGrowth = lastWeekUsers.length === 0 ? (weekUsers.length > 0 ? 100 : 0) :
      Math.round(((weekUsers.length - lastWeekUsers.length) / lastWeekUsers.length) * 100);
    
    const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'matched').length;
    
    // 计算完成率
    const completedWeek = weekRequests.filter(r => r.status === 'completed').length;
    const totalProcessedWeek = weekRequests.filter(r => r.status !== 'pending').length;
    const completionRate = totalProcessedWeek === 0 ? 0 : 
      Math.round((completedWeek / totalProcessedWeek) * 100);
    
    return {
      reportType: 'weekly',
      dateRange: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      totalMatches: weekMatched,
      newUsers: weekUsers.length,
      activeRequests: activeRequests,
      completionRate: `${completionRate}%`,
      trends: {
        matchGrowth: matchGrowth,
        userGrowth: userGrowth,
        completionRateChange: 0
      },
      details: {
        categoryBreakdown: await this.getCategoryBreakdown(weekRequests),
        dailyActivity: this.getDailyActivity(weekRequests, startDate, endDate),
        userTypeBreakdown: this.getUserTypeBreakdown(weekUsers)
      }
    };
  }
  
  // 生成月报数据
  static async generateMonthlyReport(targetDate = new Date()) {
    const users = await DataService.getUsers();
    const requests = await DataService.getRequests();
    
    const endDate = new Date(targetDate);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    const { requests: monthRequests, users: monthUsers } = this.getDateRangeData(
      startDate.toISOString(),
      endDate.toISOString(),
      requests,
      users
    );
    
    // 计算上月数据用于对比
    const lastMonthEnd = new Date(startDate);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
    
    const { requests: lastMonthRequests, users: lastMonthUsers } = this.getDateRangeData(
      lastMonthStart.toISOString(),
      lastMonthEnd.toISOString(),
      requests,
      users
    );
    
    const monthMatched = monthRequests.filter(r => r.status === 'matched').length;
    const lastMonthMatched = lastMonthRequests.filter(r => r.status === 'matched').length;
    
    const matchGrowth = lastMonthMatched === 0 ? (monthMatched > 0 ? 100 : 0) : 
      Math.round(((monthMatched - lastMonthMatched) / lastMonthMatched) * 100);
    
    const userGrowth = lastMonthUsers.length === 0 ? (monthUsers.length > 0 ? 100 : 0) :
      Math.round(((monthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100);
    
    const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'matched').length;
    
    // 计算完成率
    const completedMonth = monthRequests.filter(r => r.status === 'completed').length;
    const totalProcessedMonth = monthRequests.filter(r => r.status !== 'pending').length;
    const completionRate = totalProcessedMonth === 0 ? 0 : 
      Math.round((completedMonth / totalProcessedMonth) * 100);
    
    return {
      reportType: 'monthly',
      dateRange: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      totalMatches: monthMatched,
      newUsers: monthUsers.length,
      activeRequests: activeRequests,
      completionRate: `${completionRate}%`,
      trends: {
        matchGrowth: matchGrowth,
        userGrowth: userGrowth,
        completionRateChange: 0
      },
      details: {
        categoryBreakdown: await this.getCategoryBreakdown(monthRequests),
        weeklyActivity: this.getWeeklyActivity(monthRequests, startDate, endDate),
        userTypeBreakdown: this.getUserTypeBreakdown(monthUsers),
        topPerformers: this.getTopPerformers(monthRequests)
      }
    };
  }
  
  // 获取分类统计
  static async getCategoryBreakdown(requests) {
    const categories = await DataService.getCategories();
    const breakdown = {};
    
    categories.forEach(category => {
      breakdown[category.id] = {
        name: category.name,
        count: requests.filter(r => r.category === category.id).length,
        matched: requests.filter(r => r.category === category.id && r.status === 'matched').length
      };
    });
    
    return breakdown;
  }
  
  // 获取用户类型统计
  static getUserTypeBreakdown(users) {
    return {
      pin: users.filter(u => u.userType === 'pin').length,
      csr: users.filter(u => u.userType === 'csr').length,
      admin: users.filter(u => u.userType === 'admin').length
    };
  }
  
  // 获取每小时活动数据
  static getHourlyActivity(requests) {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    
    requests.forEach(request => {
      const hour = new Date(request.createdAt).getHours();
      hourlyData[hour].count++;
    });
    
    return hourlyData;
  }
  
  // 获取每日活动数据
  static getDailyActivity(requests, startDate, endDate) {
    const dailyData = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayRequests = requests.filter(request => {
        const requestDate = new Date(request.createdAt);
        return requestDate >= dayStart && requestDate <= dayEnd;
      });
      
      dailyData.push({
        date: current.toISOString().split('T')[0],
        count: dayRequests.length,
        matched: dayRequests.filter(r => r.status === 'matched').length
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return dailyData;
  }
  
  // 获取每周活动数据  
  static getWeeklyActivity(requests, startDate, endDate) {
    const weeklyData = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }
      
      const weekRequests = requests.filter(request => {
        const requestDate = new Date(request.createdAt);
        return requestDate >= weekStart && requestDate <= weekEnd;
      });
      
      weeklyData.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        count: weekRequests.length,
        matched: weekRequests.filter(r => r.status === 'matched').length
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return weeklyData;
  }
  
  // 获取优秀志愿者排行
  static getTopPerformers(requests) {
    const volunteerStats = {};
    
    requests.filter(r => r.status === 'matched' && r.volunteer).forEach(request => {
      const volunteer = request.volunteer;
      if (!volunteerStats[volunteer]) {
        volunteerStats[volunteer] = {
          name: volunteer,
          matches: 0,
          categories: new Set()
        };
      }
      volunteerStats[volunteer].matches++;
      volunteerStats[volunteer].categories.add(request.category);
    });
    
    return Object.values(volunteerStats)
      .map(v => ({
        ...v,
        categories: Array.from(v.categories)
      }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5);
  }
  
  // 生成综合报告
  static async generateComprehensiveReport(reportType = 'monthly', targetDate = new Date()) {
    let report;
    
    switch (reportType) {
      case 'daily':
        report = await this.generateDailyReport(targetDate);
        break;
      case 'weekly':
        report = await this.generateWeeklyReport(targetDate);
        break;
      case 'monthly':
        report = await this.generateMonthlyReport(targetDate);
        break;
      default:
        report = await this.generateWeeklyReport(targetDate);
    }
    
    const allUsers = await DataService.getUsers();
    const allRequests = await DataService.getRequests();
    
    return {
      ...report,
      generatedAt: new Date().toISOString(),
      systemInfo: {
        totalUsers: allUsers.length,
        totalRequests: allRequests.length,
        systemHealth: 'good'
      }
    };
  }
  
  // 格式化报告为易读文本
  static formatReportText(report) {
    const reportTypeNames = {
      daily: '日报',
      weekly: '周报',
      monthly: '月报'
    };
    
    let text = '';
    text += '='.repeat(60) + '\n';
    text += `CSR志愿者匹配系统 - ${reportTypeNames[report.reportType] || '报告'}\n`;
    text += '='.repeat(60) + '\n\n';
    
    text += `报告日期: ${report.date}\n`;
    text += `生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}\n\n`;
    
    text += '-'.repeat(60) + '\n';
    text += '核心指标\n';
    text += '-'.repeat(60) + '\n';
    text += `总匹配数: ${report.totalMatches} 次\n`;
    text += `新增用户: ${report.newUsers} 人\n`;
    text += `活跃请求: ${report.activeRequests} 个\n`;
    text += `完成率: ${report.completionRate}\n\n`;
    
    text += '-'.repeat(60) + '\n';
    text += '增长趋势\n';
    text += '-'.repeat(60) + '\n';
    text += `匹配增长率: ${report.trends.matchGrowth > 0 ? '+' : ''}${report.trends.matchGrowth}%\n`;
    text += `用户增长率: ${report.trends.userGrowth > 0 ? '+' : ''}${report.trends.userGrowth}%\n\n`;
    
    if (report.details.categoryBreakdown) {
      text += '-'.repeat(60) + '\n';
      text += '分类统计\n';
      text += '-'.repeat(60) + '\n';
      Object.entries(report.details.categoryBreakdown).forEach(([key, data]) => {
        text += `${data.name}: ${data.count} 个请求 (匹配: ${data.matched})\n`;
      });
      text += '\n';
    }
    
    if (report.details.userTypeBreakdown) {
      text += '-'.repeat(60) + '\n';
      text += '用户类型分布\n';
      text += '-'.repeat(60) + '\n';
      text += `PIN用户 (需要帮助): ${report.details.userTypeBreakdown.pin} 人\n`;
      text += `CSR志愿者: ${report.details.userTypeBreakdown.csr} 人\n`;
      text += `管理员: ${report.details.userTypeBreakdown.admin} 人\n\n`;
    }
    
    if (report.details.topPerformers && report.details.topPerformers.length > 0) {
      text += '-'.repeat(60) + '\n';
      text += '优秀志愿者 (Top 5)\n';
      text += '-'.repeat(60) + '\n';
      report.details.topPerformers.forEach((volunteer, index) => {
        text += `${index + 1}. ${volunteer.name}\n`;
        text += `   完成匹配: ${volunteer.matches} 次\n`;
        text += `   平均评分: ${volunteer.averageRating.toFixed(1)} 分\n`;
        text += `   服务类别: ${Array.from(volunteer.categories).join(', ')}\n\n`;
      });
    }
    
    text += '-'.repeat(60) + '\n';
    text += '系统信息\n';
    text += '-'.repeat(60) + '\n';
    text += `总用户数: ${report.systemInfo.totalUsers} 人\n`;
    text += `总请求数: ${report.systemInfo.totalRequests} 个\n`;
    text += `系统状态: ${report.systemInfo.systemHealth === 'good' ? '良好' : '异常'}\n\n`;
    
    text += '='.repeat(60) + '\n';
    text += '报告结束\n';
    text += '='.repeat(60) + '\n';
    
    return text;
  }
  
  // 导出报告为易读文本文件
  static exportReport(report, filename) {
    const textContent = this.formatReportText(report);
    const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(textBlob);
    link.download = `${filename}_${report.reportType}_${report.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 导出报告为JSON（原始数据）
  static exportReportJSON(report, filename) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${filename}_${report.reportType}_${report.date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 导出报告为CSV（简化版）
  static exportReportCSV(report, filename) {
    const csvData = [
      ['指标', '数值', '增长率'],
      ['总匹配数', report.totalMatches, `${report.trends.matchGrowth}%`],
      ['新用户', report.newUsers, `${report.trends.userGrowth}%`],
      ['活跃请求', report.activeRequests, ''],
      ['完成率', report.completionRate, '']
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvBlob);
    link.download = `${filename}_${report.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 生成并下载综合报告
  static async generateAndDownloadReport(reportType = 'monthly', targetDate = new Date()) {
    const report = await this.generateComprehensiveReport(reportType, targetDate);
    this.exportReport(report, 'system_report');
    return report;
  }
}