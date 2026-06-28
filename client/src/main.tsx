import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { 
  Layout, 
  Database, 
  FolderOpen, 
  Activity, 
  Sun, 
  Moon, 
  Cpu, 
  HardDrive, 
  Layers, 
  RefreshCw, 
  Terminal, 
  Plus, 
  Trash2, 
  Folder, 
  FileText, 
  ArrowLeft, 
  Download, 
  Upload, 
  Edit, 
  CheckCircle, 
  XCircle, 
  X,
  Link,
  ChevronRight,
  Server,
  Globe,
  Archive,
  Sliders,
  Shield,
  FolderOutput,
  Mail,
  Clock,
  GitBranch,
  Package,
  Container,
  Sparkles,
  Users,
  ExternalLink
} from 'lucide-react';
import './style.css';
import logoIcon from './assets/logo-icon.png';
import logoText from './assets/logo-text.png';

// Toast Notifications System Helper
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('hf_token') || '');
  const [username, setUsername] = useState(localStorage.getItem('hf_user') || '');
  const [role, setRole] = useState(localStorage.getItem('hf_role') || '');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init: any = {}) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.startsWith('/api/') && !url.includes('/api/auth/login')) {
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      const res = await originalFetch(input, init);
      if (res.status === 401 && !url.includes('/api/auth/login')) {
        setToken('');
        localStorage.removeItem('hf_token');
        localStorage.removeItem('hf_user');
        localStorage.removeItem('hf_role');
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [isTenantLoading, setIsTenantLoading] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newTenantUsername, setNewTenantUsername] = useState('');
  const [newTenantPassword, setNewTenantPassword] = useState('');
  const [newTenantQuota, setNewTenantQuota] = useState('5 GB');
  const [newTenantRamLimit, setNewTenantRamLimit] = useState('1 GB');
  const [newTenantCpuLimit, setNewTenantCpuLimit] = useState('1.0');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isCollaboratorLoading, setIsCollaboratorLoading] = useState(false);
  const [isNewCollabModalOpen, setIsNewCollabModalOpen] = useState(false);
  const [newCollabUsername, setNewCollabUsername] = useState('');
  const [newCollabPassword, setNewCollabPassword] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('developer');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modern DX & GitOps States
  const [dxActiveSubTab, setDxActiveSubTab] = useState<'git' | 'apps' | 'containers' | 'api'>('git');
  const [dxLoading, setDxLoading] = useState(true);
  
  // Git Deployments States
  const [gitDeployments, setGitDeployments] = useState<any[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectRepo, setNewProjectRepo] = useState('');
  const [newProjectBranch, setNewProjectBranch] = useState('main');
  const [newProjectBuildCmd, setNewProjectBuildCmd] = useState('npm run build');
  const [newProjectPublishDir, setNewProjectPublishDir] = useState('dist');
  const [newProjectRuntime, setNewProjectRuntime] = useState('static');
  
  const [viewingBuildLogsProj, setViewingBuildLogsProj] = useState<any>(null);

  // App Manager States
  const [registeredApps, setRegisteredApps] = useState<any[]>([]);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppRuntime, setNewAppRuntime] = useState('nodejs');
  const [newAppEntryPoint, setNewAppEntryPoint] = useState('index.js');
  const [newAppPort, setNewAppPort] = useState('3000');
  const [newAppEnvKey, setNewAppEnvKey] = useState('');
  const [newAppEnvVal, setNewAppEnvVal] = useState('');
  const [newAppEnvVars, setNewAppEnvVars] = useState<{key: string, value: string}[]>([]);

  // Container Manager States
  const [launchedContainers, setLaunchedContainers] = useState<any[]>([]);
  const [isLaunchContainerModalOpen, setIsLaunchContainerModalOpen] = useState(false);
  const [launchContainerName, setLaunchContainerName] = useState('');
  const [launchContainerImage, setLaunchContainerImage] = useState('');
  const [launchContainerPorts, setLaunchContainerPorts] = useState('80:80');

  // Developer API Tokens States
  const [developerTokensList, setDeveloperTokensList] = useState<any[]>([]);
  const [developerTokensLoading, setDeveloperTokensLoading] = useState(true);
  const [newDeveloperTokenLabel, setNewDeveloperTokenLabel] = useState('');
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  // Task Scheduler States
  const [cronsList, setCronsList] = useState<any[]>([]);
  const [cronLogsList, setCronLogsList] = useState<any[]>([]);
  const [cronsLoading, setCronsLoading] = useState(true);
  
  const [isNewCronModalOpen, setIsNewCronModalOpen] = useState(false);
  const [newCronCommand, setNewCronCommand] = useState('');
  const [newCronDesc, setNewCronDesc] = useState('');
  const [newCronSchedule, setNewCronSchedule] = useState('* * * * *');
  
  // Schedule wizard helpers
  const [cronPreset, setCronPreset] = useState('custom');
  const [wizardMin, setWizardMin] = useState('*');
  const [wizardHour, setWizardHour] = useState('*');
  const [wizardDay, setWizardDay] = useState('*');
  const [wizardMonth, setWizardMonth] = useState('*');
  const [wizardWeekday, setWizardWeekday] = useState('*');

  // Logs modal
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedCronForLogs, setSelectedCronForLogs] = useState<any>(null);
  
  // Execution states (on-demand trigger)
  const [isExecutingCron, setIsExecutingCron] = useState<string | null>(null);
  const [executionResultModal, setExecutionResultModal] = useState<any>(null);

  // Private Container Registries States
  const [registriesList, setRegistriesList] = useState<any[]>([]);
  const [isNewRegistryModalOpen, setIsNewRegistryModalOpen] = useState(false);
  const [newRegistryName, setNewRegistryName] = useState('');
  const [newRegistryUrl, setNewRegistryUrl] = useState('');
  const [newRegistryUsername, setNewRegistryUsername] = useState('');
  const [newRegistryToken, setNewRegistryToken] = useState('');

  // Logs & Active Alert States
  const [systemLogsList, setSystemLogsList] = useState<any[]>([]);
  const [alertRulesList, setAlertRulesList] = useState<any[]>([]);
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertTrigger, setNewAlertTrigger] = useState('OutOfMemory');
  const [newAlertTarget, setNewAlertTarget] = useState('Slack Webhook');
  const [newAlertEndpoint, setNewAlertEndpoint] = useState('');

  // Uptime Monitors States
  const [healthMonitorsList, setHealthMonitorsList] = useState<any[]>([]);
  const [newMonitorDomain, setNewMonitorDomain] = useState('');
  const [isNewMonitorModalOpen, setIsNewMonitorModalOpen] = useState(false);
  const [autoHealingEnabled, setAutoHealingEnabled] = useState(true);

  // Email Manager States
  const [emailsList, setEmailsList] = useState<any[]>([]);
  const [forwardersList, setForwardersList] = useState<any[]>([]);
  const [autorespondersList, setAutorespondersList] = useState<any[]>([]);
  const [spamSettings, setSpamSettings] = useState<any>({ enabled: false, scoreThreshold: 5.0, autoDelete: false });
  const [webmailMessagesList, setWebmailMessagesList] = useState<any[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailActiveSubTab, setEmailActiveSubTab] = useState<'accounts' | 'forwarders' | 'autoresponders' | 'spam' | 'webmail'>('accounts');

  // Modals for emails
  const [isNewEmailModalOpen, setIsNewEmailModalOpen] = useState(false);
  const [newEmailLocal, setNewEmailLocal] = useState('');
  const [newEmailDomain, setNewEmailDomain] = useState('');
  const [newEmailPassword, setNewEmailPassword] = useState('');
  const [newEmailQuota, setNewEmailQuota] = useState('500 MB');

  const [isNewForwarderModalOpen, setIsNewForwarderModalOpen] = useState(false);
  const [newForwarderSource, setNewForwarderSource] = useState('');
  const [newForwarderDest, setNewForwarderDest] = useState('');

  const [isNewAutoresponderModalOpen, setIsNewAutoresponderModalOpen] = useState(false);
  const [newAutoresponderEmail, setNewAutoresponderEmail] = useState('');
  const [newAutoresponderSubject, setNewAutoresponderSubject] = useState('Out of Office');
  const [newAutoresponderMessage, setNewAutoresponderMessage] = useState('');

  // Webmail Composer
  const [webmailComposeTo, setWebmailComposeTo] = useState('');
  const [webmailComposeFrom, setWebmailComposeFrom] = useState('');
  const [webmailComposeSubject, setWebmailComposeSubject] = useState('');
  const [webmailComposeBody, setWebmailComposeBody] = useState('');
  const [isWebmailComposeOpen, setIsWebmailComposeOpen] = useState(false);
  const [selectedWebmailMsg, setSelectedWebmailMsg] = useState<any>(null);
  
  // Dashboard System States
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isCpuCardExpanded, setIsCpuCardExpanded] = useState(false);

  // File Manager States
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'directory'>('file');

  const [isChmodModalOpen, setIsChmodModalOpen] = useState(false);
  const [chmodPath, setChmodPath] = useState<string>('');
  const [chmodMode, setChmodMode] = useState<string>('755');
  const [isCompressModalOpen, setIsCompressModalOpen] = useState(false);
  const [compressPath, setCompressPath] = useState<string>('');
  const [compressArchiveName, setCompressArchiveName] = useState<string>('');
  const [compressFormat, setCompressFormat] = useState<string>('zip');
  const [isDecompressModalOpen, setIsDecompressModalOpen] = useState(false);
  const [decompressPath, setDecompressPath] = useState<string>('');
  const [decompressDestPath, setDecompressDestPath] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<any[]>([]);

  // Database States
  const [databases, setDatabases] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [isNewDbUserModalOpen, setIsNewDbUserModalOpen] = useState(false);
  const [newDbUsername, setNewDbUsername] = useState('');
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [associateDb, setAssociateDb] = useState('');
  const [associateUser, setAssociateUser] = useState('');

  // Database Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDbName, setWizardDbName] = useState('');
  const [wizardDbType, setWizardDbType] = useState('mysql');
  const [wizardUsername, setWizardUsername] = useState('');
  const [wizardPassword, setWizardPassword] = useState('password123');

  // Adminer Setup States
  const [isAdminerOpen, setIsAdminerOpen] = useState(false);
  const [adminerDomain, setAdminerDomain] = useState('');
  const [adminerDb, setAdminerDb] = useState('');
  const [adminerUser, setAdminerUser] = useState('');
  const [adminerPass, setAdminerPass] = useState('');
  const [isAdminerInstalled, setIsAdminerInstalled] = useState(false);
  const [isInstallingAdminer, setIsInstallingAdminer] = useState(false);

  // Domains & DNS States
  const [domains, setDomains] = useState<any[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [isNewDomainModalOpen, setIsNewDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDocroot, setNewDomainDocroot] = useState('');
  const [newDomainEngine, setNewDomainEngine] = useState<'nginx' | 'apache'>('nginx');
  const [newDomainPhpVersion, setNewDomainPhpVersion] = useState('8.2');
  const [newDomainRedirect, setNewDomainRedirect] = useState('');
  const [selectedDomainDns, setSelectedDomainDns] = useState<any>(null);
  const [isDnsRecordModalOpen, setIsDnsRecordModalOpen] = useState(false);
  const [newDnsType, setNewDnsType] = useState('A');
  const [newDnsName, setNewDnsName] = useState('@');
  const [newDnsValue, setNewDnsValue] = useState('');
  const [newDnsTtl, setNewDnsTtl] = useState(3600);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [redirectDomainName, setRedirectDomainName] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  // Security Suite States
  const [securityLoading, setSecurityLoading] = useState(true);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [firewallStatus, setFirewallStatus] = useState<string>('inactive');
  const [firewallRules, setFirewallRules] = useState<any[]>([]);
  const [sslStatus, setSslStatus] = useState<any[]>([]);
  const [hotlinkStatus, setHotlinkStatus] = useState<any[]>([]);
  const [securityActiveSubTab, setSecurityActiveSubTab] = useState<'firewall' | 'ip_blocker' | 'ssh' | 'ssl' | 'hotlink'>('firewall');
  
  const [sshKeys, setSshKeys] = useState<any[]>([]);
  const [isNewSshKeyModalOpen, setIsNewSshKeyModalOpen] = useState(false);
  const [newSshKeyName, setNewSshKeyName] = useState('');
  const [newSshKeyContent, setNewSshKeyContent] = useState('');

  const [isNewIpBlockModalOpen, setIsNewIpBlockModalOpen] = useState(false);
  const [newBlockedIp, setNewBlockedIp] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  const [isNewFirewallRuleModalOpen, setIsNewFirewallRuleModalOpen] = useState(false);
  const [newRulePort, setNewRulePort] = useState('');
  const [newRuleProtocol, setNewRuleProtocol] = useState('tcp');
  const [newRuleAction, setNewRuleAction] = useState('ALLOW');
  const [newRuleComment, setNewRuleComment] = useState('');

  // Command Palette & Web Stack States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [webstackInfo, setWebstackInfo] = useState<any>(null);
  const [webstackLoading, setWebstackLoading] = useState(true);

  // AI-Assisted Server Operations States
  const [aiActiveSubTab, setAiActiveSubTab] = useState<'debugger' | 'rewrite' | 'composer'>('debugger');
  const [aiLogInput, setAiLogInput] = useState('');
  const [aiLogDiagnosis, setAiLogDiagnosis] = useState('');
  const [aiLogRootCause, setAiLogRootCause] = useState('');
  const [aiLogSolution, setAiLogSolution] = useState('');
  const [aiLogFix, setAiLogFix] = useState<any>(null);
  const [aiLogLoading, setAiLogLoading] = useState(false);
  const [aiLogFixing, setAiLogFixing] = useState(false);

  const [aiRewritePrompt, setAiRewritePrompt] = useState('');
  const [aiRewriteEngine, setAiRewriteEngine] = useState<'nginx' | 'apache' | 'caddy'>('nginx');
  const [aiRewriteResult, setAiRewriteResult] = useState('');
  const [aiRewriteLoading, setAiRewriteLoading] = useState(false);

  const [aiCronPrompt, setAiCronPrompt] = useState('');
  const [aiCronResult, setAiCronResult] = useState('');
  const [aiCronExplanation, setAiCronExplanation] = useState('');
  const [aiCronLoading, setAiCronLoading] = useState(false);

  // Cloud Integrations States
  const [cloudActiveSubTab, setCloudActiveSubTab] = useState<'backups' | 'dns'>('backups');
  const [cloudBackupsList, setCloudBackupsList] = useState<any[]>([]);
  const [cloudBackupsLoading, setCloudBackupsLoading] = useState(true);
  const [cloudBackupTriggering, setCloudBackupTriggering] = useState(false);
  const [cloudBackupProvider, setCloudBackupProvider] = useState<'s3' | 'gcs' | 'b2'>('s3');
  
  // Backup Credentials
  const [backupCreds, setBackupCreds] = useState<any>({
    s3: { accessKeyId: '', secretAccessKey: '', bucket: '' },
    gcs: { projectId: '', bucket: '' },
    b2: { keyId: '', applicationKey: '', bucket: '' }
  });

  // DNS Provider API Credentials
  const [dnsProviders, setDnsProviders] = useState<any>({
    cloudflare: { token: '', email: '', active: false },
    route53: { accessKeyId: '', secretAccessKey: '', zoneId: '', active: false },
    digitalocean: { token: '', active: false }
  });
  const [dnsLoading, setDnsLoading] = useState(true);
  const [dnsSyncing, setDnsSyncing] = useState<string | null>(null);

  // Toast Trigger
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Authentication Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      addToast('Please enter both username and password', 'error');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('hf_token', data.token);
        localStorage.setItem('hf_user', data.username);
        localStorage.setItem('hf_role', data.role);
        setToken(data.token);
        setUsername(data.username);
        setRole(data.role);
        setLoginUsername('');
        setLoginPassword('');
        addToast('Successfully authenticated!', 'success');
      } else {
        addToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      addToast('Network error during login', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    localStorage.removeItem('hf_role');
    setToken('');
    setUsername('');
    setRole('');
    addToast('Logged out successfully', 'info');
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/system/stats');
      const data = await res.json();
      setStats(data);
      setStatsLoading(false);
    } catch (err) {
      addToast('Failed to fetch system stats', 'error');
    }
  };

  // Fetch Web Stack Information
  const fetchWebstackInfo = async () => {
    try {
      const res = await fetch('/api/system/webstack');
      const data = await res.json();
      setWebstackInfo(data);
      setWebstackLoading(false);
    } catch (err) {
      addToast('Failed to fetch web stack configuration', 'error');
    }
  };

  // Switch Web Stack Engine
  const handleSwitchWebstack = async (engine: string) => {
    addToast(`Switching web server stack to ${engine}...`, 'info');
    try {
      const res = await fetch('/api/system/webstack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Successfully switched reverse-proxy to ${engine}!`, 'success');
        fetchWebstackInfo();
      } else {
        addToast(data.error || 'Failed to switch engine', 'error');
      }
    } catch (err) {
      addToast('Error switching web stack engine', 'error');
    }
  };

  // AI-Assisted Server Operations Functions
  const handleAnalyzeLog = async () => {
    if (!aiLogInput.trim()) {
      addToast('Please paste a log to analyze', 'error');
      return;
    }
    setAiLogLoading(true);
    setAiLogDiagnosis('');
    setAiLogRootCause('');
    setAiLogSolution('');
    setAiLogFix(null);
    try {
      const res = await fetch('/api/ai/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: aiLogInput })
      });
      const data = await res.json();
      if (data.success) {
        setAiLogDiagnosis(data.diagnosis);
        setAiLogRootCause(data.rootCause);
        setAiLogSolution(data.solution);
        setAiLogFix(data.fix);
        addToast('Log analyzed successfully!', 'success');
      } else {
        addToast('AI failed to analyze the log', 'error');
      }
    } catch (err) {
      addToast('Error analyzing log', 'error');
    } finally {
      setAiLogLoading(false);
    }
  };

  const handleApplyAiFix = async () => {
    if (!aiLogFix) return;
    setAiLogFixing(true);
    try {
      const res = await fetch('/api/ai/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: aiLogFix.type, parameter: aiLogFix.parameter })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setAiLogFix(null);
        setAiLogDiagnosis('');
        setAiLogRootCause('');
        setAiLogSolution('Fix successfully applied! System logs show clean health status.');
      } else {
        addToast('Failed to apply fix', 'error');
      }
    } catch (err) {
      addToast('Error applying AI fix', 'error');
    } finally {
      setAiLogFixing(false);
    }
  };

  const handleGenerateConfig = async () => {
    if (!aiRewritePrompt.trim()) {
      addToast('Please enter a description for the configuration', 'error');
      return;
    }
    setAiRewriteLoading(true);
    setAiRewriteResult('');
    try {
      const res = await fetch('/api/ai/rewrite-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiRewritePrompt, engine: aiRewriteEngine })
      });
      const data = await res.json();
      if (data.success) {
        setAiRewriteResult(data.config);
        addToast('Configuration generated!', 'success');
      } else {
        addToast('Failed to generate configuration', 'error');
      }
    } catch (err) {
      addToast('Error generating configuration', 'error');
    } finally {
      setAiRewriteLoading(false);
    }
  };

  const handleComposeCron = async () => {
    if (!aiCronPrompt.trim()) {
      addToast('Please describe the cron schedule', 'error');
      return;
    }
    setAiCronLoading(true);
    setAiCronResult('');
    setAiCronExplanation('');
    try {
      const res = await fetch('/api/ai/compose-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiCronPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setAiCronResult(data.cron);
        setAiCronExplanation(data.explanation);
        addToast('Cron schedule composed!', 'success');
      } else {
        addToast('Failed to compose cron schedule', 'error');
      }
    } catch (err) {
      addToast('Error composing cron schedule', 'error');
    } finally {
      setAiCronLoading(false);
    }
  };

  const handleApplyCronFromAi = async () => {
    if (!aiCronResult) return;
    try {
      const res = await fetch('/api/crons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: aiCronResult,
          command: 'echo "Executed AI scheduled task"',
          description: `AI Generated: ${aiCronPrompt}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setCronsList(data.crons);
        addToast('Cron job successfully added to task scheduler!', 'success');
        setActiveTab('crons');
      } else {
        addToast(data.error || 'Failed to create cron job', 'error');
      }
    } catch (err) {
      addToast('Error creating cron job', 'error');
    }
  };

  // Cloud Integration Actions
  const fetchCloudData = async () => {
    setCloudBackupsLoading(true);
    setDnsLoading(true);
    try {
      const res1 = await fetch('/api/backups');
      const data1 = await res1.json();
      setCloudBackupsList(data1.backups || []);
      setBackupCreds(data1.credentials || {});

      const res2 = await fetch('/api/domains/dns/providers');
      const data2 = await res2.json();
      setDnsProviders(data2.credentials || {});
    } catch (err) {
      addToast('Failed to load cloud integration config data', 'error');
    } finally {
      setCloudBackupsLoading(false);
      setDnsLoading(false);
    }
  };

  const handleSaveBackupCredentials = async (provider: 's3' | 'gcs' | 'b2', config: any) => {
    try {
      const res = await fetch('/api/backups/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config })
      });
      const data = await res.json();
      if (data.success) {
        setBackupCreds(data.credentials);
        addToast(`Successfully updated ${provider.toUpperCase()} credentials!`, 'success');
      } else {
        addToast(data.error || 'Failed to update credentials', 'error');
      }
    } catch (err) {
      addToast('Error saving credentials', 'error');
    }
  };

  const handleTriggerBackup = async (provider: 's3' | 'gcs' | 'b2') => {
    setCloudBackupTriggering(true);
    addToast(`Compiling and compressing workspace paths for ${provider.toUpperCase()} stream...`, 'info');
    try {
      const res = await fetch('/api/backups/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (data.success) {
        setCloudBackupsList(data.backups);
        addToast(`Backup successfully streamed and stored in ${provider.toUpperCase()}!`, 'success');
      } else {
        addToast(data.error || 'Failed to trigger backup', 'error');
      }
    } catch (err) {
      addToast('Error triggering backup', 'error');
    } finally {
      setCloudBackupTriggering(false);
    }
  };

  const handleSaveDnsCredentials = async (provider: 'cloudflare' | 'route53' | 'digitalocean', credentials: any) => {
    try {
      const res = await fetch('/api/domains/dns/providers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, credentials })
      });
      const data = await res.json();
      if (data.success) {
        setDnsProviders(data.credentials);
        addToast(`DNS API Sync for ${provider.toUpperCase()} activated successfully!`, 'success');
      } else {
        addToast(data.error || 'Failed to update DNS provider credentials', 'error');
      }
    } catch (err) {
      addToast('Error saving DNS credentials', 'error');
    }
  };

  const handleSyncDnsProvider = async (domainName: string, provider: string) => {
    setDnsSyncing(domainName);
    addToast(`Synchronizing DNS records of ${domainName} to ${provider.toUpperCase()}...`, 'info');
    try {
      const res = await fetch('/api/domains/dns/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName, provider })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Records synchronized successfully!', 'success');
      } else {
        addToast(data.error || 'Failed to synchronize DNS records', 'error');
      }
    } catch (err) {
      addToast('Error synchronizing DNS records', 'error');
    } finally {
      setDnsSyncing(null);
    }
  };

  // Fetch Files
  const fetchFiles = async (pathStr: string = '') => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(pathStr)}`);
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setFiles(data.items);
        setCurrentPath(data.currentPath);
      }
    } catch (err) {
      addToast('Failed to load files', 'error');
    } finally {
      setFilesLoading(false);
    }
  };

  // Fetch Databases
  const fetchDatabases = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/databases');
      const data = await res.json();
      setDatabases(data.databases || []);
      setDbUsers(data.dbUsers || []);
    } catch (err) {
      addToast('Failed to load databases', 'error');
    } finally {
      setDbLoading(false);
    }
  };

  // Fetch Domains & DNS Records
  const fetchDomains = async () => {
    setDomainsLoading(true);
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      setDomains(data.domains || []);

      const resMonitors = await fetch('/api/health/monitors');
      const dataMonitors = await resMonitors.json();
      setHealthMonitorsList(dataMonitors.monitors || []);
    } catch (err) {
      addToast('Failed to load domains and health monitors', 'error');
    } finally {
      setDomainsLoading(false);
    }
  };

  // Fetch Tenants
  const fetchTenants = async () => {
    setIsTenantLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setTenantsList(data.users || []);
      }
    } catch (err) {
      addToast('Failed to load tenants', 'error');
    } finally {
      setIsTenantLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantUsername.trim() || !newTenantPassword.trim()) {
      addToast('Username and password required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newTenantUsername.trim(),
          password: newTenantPassword.trim(),
          quota: newTenantQuota,
          ramLimit: newTenantRamLimit,
          cpuLimit: newTenantCpuLimit
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setTenantsList(data.users || []);
        addToast('Tenant account created successfully', 'success');
        setIsNewTenantModalOpen(false);
        setNewTenantUsername('');
        setNewTenantPassword('');
        setNewTenantQuota('5 GB');
        setNewTenantRamLimit('1 GB');
        setNewTenantCpuLimit('1.0');
      }
    } catch (err) {
      addToast('Failed to create tenant', 'error');
    }
  };

  const handleDeleteTenant = async (tenantUser: string) => {
    if (!confirm(`Are you sure you want to delete tenant ${tenantUser}? This will permanently wipe all their databases, files, and domains!`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tenantUser })
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setTenantsList(data.users || []);
        addToast('Tenant account deleted successfully', 'success');
      }
    } catch (err) {
      addToast('Failed to delete tenant', 'error');
    }
  };

  // Fetch Team Collaborators
  const fetchCollaborators = async () => {
    setIsCollaboratorLoading(true);
    try {
      const res = await fetch('/api/tenant/collaborators');
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      addToast('Failed to load collaborators', 'error');
    } finally {
      setIsCollaboratorLoading(false);
    }
  };

  const handleCreateCollaborator = async () => {
    if (!newCollabUsername.trim() || !newCollabPassword.trim()) {
      addToast('Username and password are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/tenant/collaborators/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newCollabUsername.trim(),
          password: newCollabPassword.trim(),
          role: newCollabRole
        })
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setCollaborators(data.collaborators || []);
        addToast('Collaborator invited successfully', 'success');
        setIsNewCollabModalOpen(false);
        setNewCollabUsername('');
        setNewCollabPassword('');
        setNewCollabRole('developer');
      }
    } catch (err) {
      addToast('Failed to create collaborator', 'error');
    }
  };

  const handleDeleteCollaborator = async (collabUsername: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${collabUsername}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/tenant/collaborators/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: collabUsername })
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setCollaborators(data.collaborators || []);
        addToast('Collaborator access revoked', 'success');
      }
    } catch (err) {
      addToast('Failed to delete collaborator', 'error');
    }
  };

  // Fetch Security Suite Data
  const fetchSecurityData = async () => {
    setSecurityLoading(true);
    try {
      const res1 = await fetch('/api/security/ip-block');
      const data1 = await res1.json();
      setBlockedIps(data1.blockedIps || []);

      const res2 = await fetch('/api/security/firewall');
      const data2 = await res2.json();
      setFirewallStatus(data2.firewallStatus || 'inactive');
      setFirewallRules(data2.firewallRules || []);

      const res3 = await fetch('/api/security/ssl-status');
      const data3 = await res3.json();
      setSslStatus(data3.sslStatus || []);

      const res4 = await fetch('/api/security/hotlink');
      const data4 = await res4.json();
      setHotlinkStatus(data4.hotlinkStatus || []);

      const res5 = await fetch('/api/ftp-ssh');
      const data5 = await res5.json();
      setSshKeys(data5.sshKeys || []);

      const resLogs = await fetch('/api/logs/stream');
      const dataLogs = await resLogs.json();
      setSystemLogsList(dataLogs.logs || []);

      const resAlerts = await fetch('/api/security/alerts');
      const dataAlerts = await resAlerts.json();
      setAlertRulesList(dataAlerts.rules || []);
    } catch (err) {
      addToast('Failed to load security suite data', 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleAddIpBlock = async () => {
    if (!newBlockedIp.trim()) return;
    try {
      const res = await fetch('/api/security/ip-block/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newBlockedIp, reason: newBlockReason })
      });
      const data = await res.json();
      if (data.success) {
        setBlockedIps(data.blockedIps);
        setIsNewIpBlockModalOpen(false);
        setNewBlockedIp('');
        setNewBlockReason('');
        addToast('IP Address blocked successfully', 'success');
      } else {
        addToast(data.error || 'Failed to block IP', 'error');
      }
    } catch (err) {
      addToast('Error blocking IP', 'error');
    }
  };

  const handleDeleteIpBlock = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock IP ${ip}?`)) return;
    try {
      const res = await fetch('/api/security/ip-block/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (data.success) {
        setBlockedIps(data.blockedIps);
        addToast('IP Address unblocked successfully', 'success');
      } else {
        addToast(data.error || 'Failed to unblock IP', 'error');
      }
    } catch (err) {
      addToast('Error unblocking IP', 'error');
    }
  };

  const handleToggleFirewall = async () => {
    try {
      const res = await fetch('/api/security/firewall/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFirewallStatus(data.firewallStatus);
        addToast(`Firewall is now ${data.firewallStatus}`, 'success');
      } else {
        addToast(data.error || 'Failed to toggle firewall', 'error');
      }
    } catch (err) {
      addToast('Error toggling firewall', 'error');
    }
  };

  const handleAddFirewallRule = async () => {
    if (!newRulePort.trim()) return;
    try {
      const res = await fetch('/api/security/firewall/rules/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: newRulePort, protocol: newRuleProtocol, action: newRuleAction, comment: newRuleComment })
      });
      const data = await res.json();
      if (data.success) {
        setFirewallRules(data.firewallRules);
        setIsNewFirewallRuleModalOpen(false);
        setNewRulePort('');
        setNewRuleComment('');
        addToast('Firewall rule added successfully', 'success');
      } else {
        addToast(data.error || 'Failed to add rule', 'error');
      }
    } catch (err) {
      addToast('Error adding rule', 'error');
    }
  };

  const handleDeleteFirewallRule = async (index: number, ruleDef: string) => {
    if (!confirm(`Are you sure you want to delete this firewall rule?`)) return;
    try {
      const res = await fetch('/api/security/firewall/rules/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, ruleDef })
      });
      const data = await res.json();
      if (data.success) {
        setFirewallRules(data.firewallRules);
        addToast('Firewall rule deleted successfully', 'success');
      } else {
        addToast(data.error || 'Failed to delete rule', 'error');
      }
    } catch (err) {
      addToast('Error deleting rule', 'error');
    }
  };

  const handleRenewSsl = async (domain: string) => {
    addToast(`Initiating certificate renewal for ${domain}...`, 'info');
    try {
      const res = await fetch('/api/security/ssl/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Successfully renewed SSL certificate for ${domain}`, 'success');
        const res3 = await fetch('/api/security/ssl-status');
        const data3 = await res3.json();
        setSslStatus(data3.sslStatus || []);
      } else {
        addToast(data.error || 'Failed to renew SSL', 'error');
      }
    } catch (err) {
      addToast('Error renewing SSL', 'error');
    }
  };

  const handleToggleHotlink = async (domain: string) => {
    try {
      const res = await fetch('/api/security/hotlink/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (data.success) {
        setHotlinkStatus(prev => prev.map(item => item.domain === domain ? { ...item, enabled: data.enabled } : item));
        addToast(`Hotlink protection ${data.enabled ? 'enabled' : 'disabled'} for ${domain}`, 'success');
      } else {
        addToast(data.error || 'Failed to toggle hotlink protection', 'error');
      }
    } catch (err) {
      addToast('Error toggling hotlink protection', 'error');
    }
  };

  const handleCreateSshKey = async () => {
    if (!newSshKeyName.trim() || !newSshKeyContent.trim()) {
      addToast('Key name and key content are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/ssh/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSshKeyName, key: newSshKeyContent })
      });
      const data = await res.json();
      if (data.success) {
        setSshKeys(data.sshKeys);
        setIsNewSshKeyModalOpen(false);
        setNewSshKeyName('');
        setNewSshKeyContent('');
        addToast('SSH Public Key authorized successfully', 'success');
      } else {
        addToast(data.error || 'Failed to authorize SSH key', 'error');
      }
    } catch (err) {
      addToast('Error authorizing SSH key', 'error');
    }
  };

  const handleDeleteSshKey = async (name: string) => {
    if (!confirm(`Are you sure you want to revoke SSH key "${name}"?`)) return;
    try {
      const res = await fetch('/api/ssh/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        setSshKeys(data.sshKeys);
        addToast('SSH key revoked successfully', 'success');
      } else {
        addToast(data.error || 'Failed to revoke SSH key', 'error');
      }
    } catch (err) {
      addToast('Error revoking SSH key', 'error');
    }
  };

  const fetchEmailData = async () => {
    setEmailsLoading(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setEmailsList(data.emails || []);
      setForwardersList(data.emailForwarders || []);
      setAutorespondersList(data.autoresponders || []);
      setSpamSettings(data.spamFilter || { enabled: false, scoreThreshold: 5.0, autoDelete: false });
    } catch (err) {
      addToast('Failed to load email server data', 'error');
    } finally {
      setEmailsLoading(false);
    }
  };

  const fetchWebmailMessages = async () => {
    try {
      const res = await fetch('/api/emails/webmail/messages');
      const data = await res.json();
      setWebmailMessagesList(data.messages || []);
    } catch (err) {
      addToast('Failed to load webmail messages', 'error');
    }
  };

  const handleCreateEmail = async () => {
    if (!newEmailLocal.trim() || !newEmailDomain) {
      addToast('Please specify email prefix and select a domain', 'error');
      return;
    }
    const fullEmail = `${newEmailLocal.trim()}@${newEmailDomain}`;
    try {
      const res = await fetch('/api/emails/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail, quota: newEmailQuota, password: newEmailPassword })
      });
      const data = await res.json();
      if (data.success) {
        setEmailsList(data.emails);
        setIsNewEmailModalOpen(false);
        setNewEmailLocal('');
        setNewEmailPassword('');
        addToast('Email account created successfully', 'success');
      } else {
        addToast(data.error || 'Failed to create email account', 'error');
      }
    } catch (err) {
      addToast('Error creating email account', 'error');
    }
  };

  const handleDeleteEmail = async (emailStr: string) => {
    if (!confirm(`Are you sure you want to delete email account "${emailStr}"?`)) return;
    try {
      const res = await fetch('/api/emails/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStr })
      });
      const data = await res.json();
      if (data.success) {
        setEmailsList(data.emails);
        addToast('Email account deleted successfully', 'success');
      } else {
        addToast(data.error || 'Failed to delete email account', 'error');
      }
    } catch (err) {
      addToast('Error deleting email account', 'error');
    }
  };

  const handleCreateForwarder = async () => {
    if (!newForwarderSource.trim() || !newForwarderDest.trim()) {
      addToast('Please enter both source and destination emails', 'error');
      return;
    }
    try {
      const res = await fetch('/api/emails/forwarders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: newForwarderSource.trim(), destination: newForwarderDest.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setForwardersList(data.emailForwarders);
        setIsNewForwarderModalOpen(false);
        setNewForwarderSource('');
        setNewForwarderDest('');
        addToast('Email forwarder created successfully', 'success');
      } else {
        addToast(data.error || 'Failed to create forwarder', 'error');
      }
    } catch (err) {
      addToast('Error creating forwarder', 'error');
    }
  };

  const handleDeleteForwarder = async (src: string, dest: string) => {
    if (!confirm(`Delete forwarder from ${src} to ${dest}?`)) return;
    try {
      const res = await fetch('/api/emails/forwarders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: src, destination: dest })
      });
      const data = await res.json();
      if (data.success) {
        setForwardersList(data.emailForwarders);
        addToast('Email forwarder deleted', 'success');
      } else {
        addToast(data.error || 'Failed to delete forwarder', 'error');
      }
    } catch (err) {
      addToast('Error deleting forwarder', 'error');
    }
  };

  const handleCreateAutoresponder = async () => {
    if (!newAutoresponderEmail || !newAutoresponderSubject.trim() || !newAutoresponderMessage.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    try {
      const res = await fetch('/api/emails/autoresponders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAutoresponderEmail,
          subject: newAutoresponderSubject.trim(),
          message: newAutoresponderMessage.trim(),
          enabled: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutorespondersList(data.autoresponders);
        setIsNewAutoresponderModalOpen(false);
        setNewAutoresponderEmail('');
        setNewAutoresponderMessage('');
        addToast('Autoresponder configured successfully', 'success');
      } else {
        addToast(data.error || 'Failed to save autoresponder', 'error');
      }
    } catch (err) {
      addToast('Error saving autoresponder', 'error');
    }
  };

  const handleDeleteAutoresponder = async (emailStr: string) => {
    if (!confirm(`Delete autoresponder for ${emailStr}?`)) return;
    try {
      const res = await fetch('/api/emails/autoresponders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStr })
      });
      const data = await res.json();
      if (data.success) {
        setAutorespondersList(data.autoresponders);
        addToast('Autoresponder deleted successfully', 'success');
      } else {
        addToast(data.error || 'Failed to delete autoresponder', 'error');
      }
    } catch (err) {
      addToast('Error deleting autoresponder', 'error');
    }
  };

  const handleToggleSpamFilter = async () => {
    try {
      const res = await fetch('/api/emails/spam-filter/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSpamSettings(data.spamFilter);
        addToast(`SpamAssassin is now ${data.spamFilter.enabled ? 'Enabled' : 'Disabled'}`, 'success');
      }
    } catch (err) {
      addToast('Error toggling spam filter', 'error');
    }
  };

  const handleSaveSpamConfig = async (threshold: number, autoDel: boolean) => {
    try {
      const res = await fetch('/api/emails/spam-filter/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreThreshold: threshold, autoDelete: autoDel })
      });
      const data = await res.json();
      if (data.success) {
        setSpamSettings(data.spamFilter);
        addToast('SpamAssassin settings saved successfully', 'success');
      }
    } catch (err) {
      addToast('Error saving spam filter configurations', 'error');
    }
  };

  const handleSendWebmailMessage = async () => {
    if (!webmailComposeFrom || !webmailComposeTo.trim() || !webmailComposeSubject.trim() || !webmailComposeBody.trim()) {
      addToast('Please fill in all composer fields', 'error');
      return;
    }
    try {
      const res = await fetch('/api/emails/webmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: webmailComposeFrom,
          to: webmailComposeTo.trim(),
          subject: webmailComposeSubject.trim(),
          body: webmailComposeBody.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setWebmailMessagesList(data.messages);
        setIsWebmailComposeOpen(false);
        setWebmailComposeTo('');
        setWebmailComposeSubject('');
        setWebmailComposeBody('');
        addToast('Webmail message simulated/sent successfully', 'success');
        // Reload messages after 1.5s in case of auto-replies
        setTimeout(fetchWebmailMessages, 1500);
      } else {
        addToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      addToast('Error sending message', 'error');
    }
  };

  // Fetch Cron Jobs
  const fetchCrons = async () => {
    setCronsLoading(true);
    try {
      const res = await fetch('/api/crons');
      const data = await res.json();
      setCronsList(data.crons || []);
    } catch (err) {
      addToast('Failed to load cron jobs', 'error');
    } finally {
      setCronsLoading(false);
    }
  };

  // Fetch Cron Logs
  const fetchCronLogs = async () => {
    try {
      const res = await fetch('/api/crons/logs');
      const data = await res.json();
      setCronLogsList(data.logs || []);
    } catch (err) {
      addToast('Failed to load execution logs', 'error');
    }
  };

  // Create Cron Job
  const handleCreateCron = async () => {
    if (!newCronCommand.trim()) {
      addToast('Command is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/crons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: newCronSchedule,
          command: newCronCommand.trim(),
          description: newCronDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setCronsList(data.crons);
        setIsNewCronModalOpen(false);
        setNewCronCommand('');
        setNewCronDesc('');
        setNewCronSchedule('* * * * *');
        setCronPreset('custom');
        addToast('Cron job scheduled successfully', 'success');
      } else {
        addToast(data.error || 'Failed to create cron job', 'error');
      }
    } catch (err) {
      addToast('Error scheduling cron job', 'error');
    }
  };

  // Delete Cron Job
  const handleDeleteCron = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cron job?')) return;
    try {
      const res = await fetch('/api/crons/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setCronsList(data.crons);
        addToast('Cron job removed successfully', 'success');
      } else {
        addToast(data.error || 'Failed to delete cron job', 'error');
      }
    } catch (err) {
      addToast('Error removing cron job', 'error');
    }
  };

  // Execute Cron Job On-demand
  const handleExecuteCron = async (id: string) => {
    setIsExecutingCron(id);
    addToast('Executing cron job command on-demand...', 'info');
    try {
      const res = await fetch('/api/crons/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setExecutionResultModal(data.log);
        addToast('Execution completed', 'success');
        fetchCronLogs();
      } else {
        addToast(data.error || 'Execution failed', 'error');
      }
    } catch (err) {
      addToast('Error executing cron job', 'error');
    } finally {
      setIsExecutingCron(null);
    }
  };

  // DX Suite Fetchers
  const fetchDxData = async () => {
    setDxLoading(true);
    try {
      const res1 = await fetch('/api/dx/deployments');
      const data1 = await res1.json();
      setGitDeployments(data1.deployments || []);

      const res2 = await fetch('/api/dx/apps');
      const data2 = await res2.json();
      setRegisteredApps(data2.apps || []);

      const res3 = await fetch('/api/dx/containers');
      const data3 = await res3.json();
      setLaunchedContainers(data3.containers || []);

      const resRegs = await fetch('/api/containers/registries');
      const dataRegs = await resRegs.json();
      setRegistriesList(dataRegs.registries || []);

      fetchDeveloperTokens();
    } catch (err) {
      addToast('Failed to load DX & GitOps workspace data', 'error');
    } finally {
      setDxLoading(false);
    }
  };

  // Fetch Developer API Tokens
  const fetchDeveloperTokens = async () => {
    setDeveloperTokensLoading(true);
    try {
      const res = await fetch('/api/developer/tokens');
      const data = await res.json();
      if (data.success) {
        setDeveloperTokensList(data.tokens);
      }
    } catch (err) {
      addToast('Failed to load developer API tokens', 'error');
    } finally {
      setDeveloperTokensLoading(false);
    }
  };

  // Generate Developer API Token
  const handleGenerateDeveloperToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeveloperTokenLabel.trim()) {
      addToast('Label is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/developer/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newDeveloperTokenLabel.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDeveloperTokensList(prev => [...prev, data.token]);
        setNewDeveloperTokenLabel('');
        setNewlyCreatedToken(data.token.token);
        addToast('Developer API token generated successfully', 'success');
      } else {
        addToast(data.error || 'Failed to generate token', 'error');
      }
    } catch (err) {
      addToast('Error generating developer API token', 'error');
    }
  };

  // Revoke Developer API Token
  const handleRevokeDeveloperToken = async (tokenToDelete: string) => {
    if (!confirm('Are you sure you want to revoke this developer API token? This will immediately disconnect any active CLI configurations using this key.')) return;
    try {
      const res = await fetch('/api/developer/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToDelete })
      });
      const data = await res.json();
      if (data.success) {
        setDeveloperTokensList(prev => prev.filter(t => t.token !== tokenToDelete));
        if (newlyCreatedToken === tokenToDelete) {
          setNewlyCreatedToken(null);
        }
        addToast('Developer API token revoked', 'info');
      } else {
        addToast(data.error || 'Failed to revoke token', 'error');
      }
    } catch (err) {
      addToast('Error revoking token', 'error');
    }
  };

  // Create Container Registry Profile
  const handleCreateRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegistryName || !newRegistryUrl || !newRegistryUsername || !newRegistryToken) {
      addToast('All registry fields are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/containers/registries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRegistryName,
          url: newRegistryUrl,
          username: newRegistryUsername,
          token: newRegistryToken
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegistriesList(prev => [...prev, data.registry]);
        setIsNewRegistryModalOpen(false);
        setNewRegistryName('');
        setNewRegistryUrl('');
        setNewRegistryUsername('');
        setNewRegistryToken('');
        addToast('Private registry profile linked successfully', 'success');
      } else {
        addToast(data.error || 'Failed to link registry', 'error');
      }
    } catch (err) {
      addToast('Error saving registry settings', 'error');
    }
  };

  // Create Active Webhook Alert Rule
  const handleCreateAlertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertName.trim() || !newAlertEndpoint.trim()) {
      addToast('Name and Webhook URL are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/security/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlertName,
          trigger: newAlertTrigger,
          target: newAlertTarget,
          endpoint: newAlertEndpoint
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlertRulesList(prev => [...prev, data.rule]);
        setIsNewAlertModalOpen(false);
        setNewAlertName('');
        setNewAlertEndpoint('');
        addToast('Active alert rule established', 'success');
      } else {
        addToast(data.error || 'Failed to save alert rule', 'error');
      }
    } catch (err) {
      addToast('Error saving alert rules', 'error');
    }
  };

  // Add HTTP Uptime Monitor
  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonitorDomain.trim()) {
      addToast('Domain name is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/health/monitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newMonitorDomain.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setHealthMonitorsList(prev => [...prev, data.monitor]);
        setIsNewMonitorModalOpen(false);
        setNewMonitorDomain('');
        addToast('HTTP uptime monitor registered', 'success');
      } else {
        addToast(data.error || 'Failed to register monitor', 'error');
      }
    } catch (err) {
      addToast('Error registering monitor', 'error');
    }
  };

  // Delete HTTP Uptime Monitor
  const handleDeleteMonitor = async (domain: string) => {
    if (!confirm(`Are you sure you want to suspend uptime checks for ${domain}?`)) return;
    try {
      const res = await fetch('/api/health/monitors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (data.success) {
        setHealthMonitorsList(prev => prev.filter(m => m.domain !== domain));
        addToast('Uptime monitor suspended', 'info');
      } else {
        addToast(data.error || 'Failed to delete monitor', 'error');
      }
    } catch (err) {
      addToast('Error deleting uptime check', 'error');
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectRepo.trim()) {
      addToast('Repository URL is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/dx/deployments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: newProjectRepo.trim(),
          branch: newProjectBranch,
          buildCommand: newProjectBuildCmd.trim(),
          publishDir: newProjectPublishDir.trim(),
          runtime: newProjectRuntime
        })
      });
      const data = await res.json();
      if (data.success) {
        setGitDeployments(data.deployments);
        setIsNewProjectModalOpen(false);
        setNewProjectRepo('');
        addToast('Git repository linked and deployed successfully!', 'success');
      } else {
        addToast(data.error || 'Failed to link repository', 'error');
      }
    } catch (err) {
      addToast('Error linking repository', 'error');
    }
  };

  const handleRedeployProject = async (id: string) => {
    try {
      const res = await fetch('/api/dx/deployments/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setGitDeployments(data.deployments);
        addToast('Redeployment triggered in the background', 'info');
        setTimeout(fetchDxData, 4000);
      }
    } catch (err) {
      addToast('Error triggering redeployment', 'error');
    }
  };

  const handleRegisterApp = async () => {
    if (!newAppName.trim() || !newAppEntryPoint.trim()) {
      addToast('Application name and entry point are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/dx/apps/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAppName.trim(),
          runtime: newAppRuntime,
          entryPoint: newAppEntryPoint.trim(),
          port: newAppPort,
          envVars: newAppEnvVars
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredApps(data.apps);
        setIsNewAppModalOpen(false);
        setNewAppName('');
        setNewAppEntryPoint('index.js');
        setNewAppEnvVars([]);
        addToast('Application runtime registered online!', 'success');
      } else {
        addToast(data.error || 'Failed to register app', 'error');
      }
    } catch (err) {
      addToast('Error registering application', 'error');
    }
  };

  const handleAppAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete' && !confirm('Are you sure you want to unregister this application?')) return;
    try {
      const res = await fetch('/api/dx/apps/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredApps(data.apps);
        addToast(`Successfully performed "${action}" action on app`, 'success');
      }
    } catch (err) {
      addToast('Error modifying app runtime state', 'error');
    }
  };

  const handleLaunchContainer = async () => {
    if (!launchContainerName.trim() || !launchContainerImage.trim()) {
      addToast('Container name and image name are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/dx/containers/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: launchContainerName.trim(),
          image: launchContainerImage.trim(),
          portBindings: launchContainerPorts
        })
      });
      const data = await res.json();
      if (data.success) {
        setLaunchedContainers(data.containers);
        setIsLaunchContainerModalOpen(false);
        setLaunchContainerName('');
        setLaunchContainerImage('');
        addToast('Container launched successfully', 'success');
      } else {
        addToast(data.error || 'Failed to launch container', 'error');
      }
    } catch (err) {
      addToast('Error launching container', 'error');
    }
  };

  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this container?')) return;
    try {
      const res = await fetch('/api/dx/containers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      if (data.success) {
        setLaunchedContainers(data.containers);
        addToast(`Container action "${action}" completed`, 'success');
      }
    } catch (err) {
      addToast('Error modifying container state', 'error');
    }
  };

  // Cron schedule builder assistant
  useEffect(() => {
    if (cronPreset !== 'custom') {
      setNewCronSchedule(cronPreset);
    } else {
      setNewCronSchedule(`${wizardMin} ${wizardHour} ${wizardDay} ${wizardMonth} ${wizardWeekday}`);
    }
  }, [cronPreset, wizardMin, wizardHour, wizardDay, wizardMonth, wizardWeekday]);

  useEffect(() => {
    fetchWebstackInfo();
    fetchCloudData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.port === '3000' ? 'localhost:3001' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws/stats?token=${encodeURIComponent(token)}`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Stats WS connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStats(data);
          setStatsLoading(false);
        } catch (err) {
          console.error('Failed to parse stats payload', err);
        }
      };

      socket.onclose = () => {
        console.log('Stats WS disconnected, reconnecting...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('Stats WS error', err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Global Key Listener for Cmd+K / Ctrl+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeTab === 'files') {
      fetchFiles(currentPath);
    } else if (activeTab === 'databases') {
      fetchDatabases();
    } else if (activeTab === 'domains') {
      fetchDomains();
    } else if (activeTab === 'security') {
      fetchSecurityData();
    } else if (activeTab === 'emails') {
      fetchEmailData();
      fetchWebmailMessages();
    } else if (activeTab === 'crons') {
      fetchCrons();
      fetchCronLogs();
    } else if (activeTab === 'dx') {
      fetchDxData();
    } else if (activeTab === 'team') {
      fetchCollaborators();
    } else if (activeTab === 'tenants') {
      fetchTenants();
    }
  }, [activeTab]);

  // File Operations
  const handleFolderClick = (folderName: string) => {
    const nextPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    fetchFiles(nextPath);
  };

  const handleBackClick = () => {
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  const handleOpenFile = async (file: any) => {
    try {
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const res = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        setSelectedFile(file);
        setEditorContent(data.content);
        setIsEditorOpen(true);
      }
    } catch (err) {
      addToast('Error reading file content', 'error');
    }
  };

  const handleSaveFileContent = async () => {
    if (!selectedFile) return;
    try {
      const filePath = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;
      const res = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: editorContent })
      });
      const data = await res.json();
      if (data.success) {
        addToast('File saved successfully!', 'success');
        setIsEditorOpen(false);
      } else {
        addToast(data.error || 'Failed to save file', 'error');
      }
    } catch (err) {
      addToast('Error saving file', 'error');
    }
  };

  const handleCreateFileOrFolder = async () => {
    if (!newFileName.trim()) return;
    try {
      const filePath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, type: newFileType })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`${newFileType === 'directory' ? 'Directory' : 'File'} created!`, 'success');
        setIsNewFileModalOpen(false);
        setNewFileName('');
        fetchFiles(currentPath);
      } else {
        addToast(data.error || 'Creation failed', 'error');
      }
    } catch (err) {
      addToast('Error creating item', 'error');
    }
  };

  const handleDeleteFileOrFolder = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const filePath = currentPath ? `${currentPath}/${name}` : name;
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Item deleted', 'success');
        fetchFiles(currentPath);
      } else {
        addToast(data.error || 'Deletion failed', 'error');
      }
    } catch (err) {
      addToast('Error deleting item', 'error');
    }
  };

  const handleChmod = async () => {
    if (!chmodPath || !chmodMode) return;
    try {
      const res = await fetch('/api/files/chmod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: chmodPath, mode: chmodMode })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Permissions updated successfully!', 'success');
        setIsChmodModalOpen(false);
        fetchFiles(currentPath);
      } else {
        addToast(data.error || 'Failed to update permissions', 'error');
      }
    } catch (err) {
      addToast('Error updating permissions', 'error');
    }
  };

  const handleCompress = async () => {
    if (!compressPath || !compressArchiveName) return;
    try {
      const res = await fetch('/api/files/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: compressPath, archiveName: compressArchiveName, format: compressFormat })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Items compressed successfully!', 'success');
        setIsCompressModalOpen(false);
        setCompressArchiveName('');
        fetchFiles(currentPath);
      } else {
        addToast(data.error || 'Failed to compress items', 'error');
      }
    } catch (err) {
      addToast('Error compressing items', 'error');
    }
  };

  const handleDecompress = async () => {
    if (!decompressPath) return;
    try {
      const res = await fetch('/api/files/decompress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: decompressPath, destPath: decompressDestPath })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Archive extracted successfully!', 'success');
        setIsDecompressModalOpen(false);
        setDecompressDestPath('');
        fetchFiles(currentPath);
      } else {
        addToast(data.error || 'Failed to extract archive', 'error');
      }
    } catch (err) {
      addToast('Error extracting archive', 'error');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesToUpload = e.target.files;
    if (!filesToUpload || filesToUpload.length === 0) return;
    
    setIsUploadModalOpen(true);
    const newUploading = Array.from(filesToUpload).map(f => {
      const isDirectory = f.size === 0 && !f.type && !f.name.includes('.');
      return {
        name: f.name,
        status: isDirectory ? 'folder_error' : 'pending',
        progress: 0
      };
    });
    setUploadingFiles(newUploading);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const isDirectory = file.size === 0 && !file.type && !file.name.includes('.');
      if (isDirectory) continue;

      setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));
      
      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-file-name': encodeURIComponent(file.name),
            'x-folder-path': encodeURIComponent(currentPath),
            'Content-Type': 'application/octet-stream'
          },
          body: file
        });
        const data = await res.json();
        if (data.success) {
          setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'success', progress: 100 } : f));
        } else {
          setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
        }
      } catch (err) {
        setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
      }
    }
    fetchFiles(currentPath);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;
    
    setIsUploadModalOpen(true);
    const uploadsList: any[] = [];
    const filesToUpload: any[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) {
            uploadsList.push({ name: entry.name, status: 'folder_error', progress: 0 });
            filesToUpload.push(null);
          } else {
            const file = item.getAsFile();
            if (file) {
              uploadsList.push({ name: file.name, status: 'pending', progress: 0 });
              filesToUpload.push(file);
            }
          }
        } else {
          const file = item.getAsFile();
          if (file) {
            uploadsList.push({ name: file.name, status: 'pending', progress: 0 });
            filesToUpload.push(file);
          }
        }
      }
    }
    
    setUploadingFiles(uploadsList);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      if (!file) continue;
      
      setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));
      
      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-file-name': encodeURIComponent(file.name),
            'x-folder-path': encodeURIComponent(currentPath),
            'Content-Type': 'application/octet-stream'
          },
          body: file
        });
        const data = await res.json();
        if (data.success) {
          setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'success', progress: 100 } : f));
        } else {
          setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
        }
      } catch (err) {
        setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
      }
    }
    fetchFiles(currentPath);
  };

  // Database Operations
  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) return;
    try {
      const res = await fetch('/api/databases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDbName, type: 'mysql' })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Database created!', 'success');
        setIsNewDbModalOpen(false);
        setNewDbName('');
        fetchDatabases();
      } else {
        addToast(data.error || 'Failed to create database', 'error');
      }
    } catch (err) {
      addToast('Error creating database', 'error');
    }
  };

  const handleDeleteDatabase = async (name: string) => {
    if (!confirm(`Drop database "${name}"? This deletes all tables permanently.`)) return;
    try {
      const res = await fetch('/api/databases/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Database dropped', 'success');
        fetchDatabases();
      }
    } catch (err) {
      addToast('Error dropping database', 'error');
    }
  };

  const handleCreateDbUser = async () => {
    if (!newDbUsername.trim()) return;
    try {
      const res = await fetch('/api/databases/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newDbUsername })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Database user created!', 'success');
        setIsNewDbUserModalOpen(false);
        setNewDbUsername('');
        fetchDatabases();
      } else {
        addToast(data.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      addToast('Error creating database user', 'error');
    }
  };

  const handleDeleteDbUser = async (username: string) => {
    if (!confirm(`Delete database user "${username}"?`)) return;
    try {
      const res = await fetch('/api/databases/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Database user deleted', 'success');
        fetchDatabases();
      }
    } catch (err) {
      addToast('Error deleting user', 'error');
    }
  };

  const handleAssociateUser = async () => {
    if (!associateDb || !associateUser) return;
    try {
      const res = await fetch('/api/databases/users/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbName: associateDb, username: associateUser })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Privileges granted!', 'success');
        setIsAssociateModalOpen(false);
        fetchDatabases();
      }
    } catch (err) {
      addToast('Error associating user', 'error');
    }
  };

  // Database Wizard step handler
  const handleWizardNextStep = async () => {
    if (wizardStep === 1) {
      if (!wizardDbName.trim()) {
        addToast('Please enter a database name', 'error');
        return;
      }
      try {
        const res = await fetch('/api/databases/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: wizardDbName, type: wizardDbType })
        });
        const data = await res.json();
        if (data.success) {
          addToast('Wizard Step 1: Database created successfully!', 'success');
          setWizardStep(2);
        } else {
          addToast(data.error || 'Failed to create database', 'error');
        }
      } catch (err) {
        addToast('Error creating database in wizard', 'error');
      }
    } else if (wizardStep === 2) {
      if (!wizardUsername.trim()) {
        addToast('Please enter a username', 'error');
        return;
      }
      try {
        const res = await fetch('/api/databases/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: wizardUsername, password: wizardPassword, type: wizardDbType })
        });
        const data = await res.json();
        if (data.success) {
          addToast('Wizard Step 2: Database user created successfully!', 'success');
          setWizardStep(3);
        } else {
          addToast(data.error || 'Failed to create user', 'error');
        }
      } catch (err) {
        addToast('Error creating user in wizard', 'error');
      }
    } else if (wizardStep === 3) {
      try {
        const res = await fetch('/api/databases/users/associate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbName: wizardDbName, username: wizardUsername })
        });
        const data = await res.json();
        if (data.success) {
          addToast('Wizard Step 3: Privileges mapped! Wizard Complete.', 'success');
          setIsWizardOpen(false);
          setWizardStep(1);
          setWizardDbName('');
          setWizardUsername('');
          fetchDatabases();
        } else {
          addToast(data.error || 'Failed to grant privileges', 'error');
        }
      } catch (err) {
        addToast('Error granting privileges in wizard', 'error');
      }
    }
  };

  // Adminer installer trigger
  const handleInstallAdminer = async () => {
    if (!adminerDomain) {
      addToast('Please select a domain to install Adminer', 'error');
      return;
    }
    setIsInstallingAdminer(true);
    try {
      const res = await fetch('/api/databases/adminer/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName: adminerDomain })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Adminer installed successfully on ' + adminerDomain, 'success');
        setIsAdminerInstalled(true);
      } else {
        addToast(data.error || 'Failed to install Adminer', 'error');
      }
    } catch (err) {
      addToast('Error installing Adminer', 'error');
    } finally {
      setIsInstallingAdminer(false);
    }
  };

  // Adminer SSO trigger
  const handleAdminerSSO = async () => {
    if (!adminerDomain || !adminerDb || !adminerUser) {
      addToast('Please fill in all SSO fields', 'error');
      return;
    }
    try {
      const res = await fetch('/api/databases/adminer/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: adminerDomain,
          dbName: adminerDb,
          username: adminerUser,
          password: adminerPass
        })
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        addToast('SSO Redirect generated. Redirecting...', 'success');
        window.open(data.redirectUrl, '_blank');
      } else {
        addToast(data.error || 'Failed to establish SSO login', 'error');
      }
    } catch (err) {
      addToast('Error generating Adminer SSO login', 'error');
    }
  };

  // Domain Operations
  const handleCreateDomain = async () => {
    if (!newDomainName.trim()) return;
    try {
      const res = await fetch('/api/domains/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDomainName,
          docroot: newDomainDocroot || undefined,
          engine: newDomainEngine,
          phpVersion: newDomainPhpVersion,
          redirectUrl: newDomainRedirect || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Domain created successfully!', 'success');
        setIsNewDomainModalOpen(false);
        setNewDomainName('');
        setNewDomainDocroot('');
        setNewDomainRedirect('');
        fetchDomains();
      } else {
        addToast(data.error || 'Failed to create domain', 'error');
      }
    } catch (err) {
      addToast('Error creating domain', 'error');
    }
  };

  const handleDeleteDomain = async (name: string) => {
    if (!confirm(`Are you sure you want to delete domain "${name}"? This removes its virtual host and DNS configuration.`)) return;
    try {
      const res = await fetch('/api/domains/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Domain deleted successfully', 'success');
        fetchDomains();
        if (selectedDomainDns?.name === name) {
          setSelectedDomainDns(null);
        }
      } else {
        addToast(data.error || 'Failed to delete domain', 'error');
      }
    } catch (err) {
      addToast('Error deleting domain', 'error');
    }
  };

  const handleToggleVh = async (name: string) => {
    try {
      const res = await fetch('/api/webserver/vh/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Virtual host status toggled!', 'success');
        fetchDomains();
      } else {
        addToast(data.error || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      addToast('Error toggling virtual host status', 'error');
    }
  };

  const handleAddDnsRecord = async () => {
    if (!selectedDomainDns) return;
    if (!newDnsValue.trim()) return;
    try {
      const res = await fetch('/api/domains/dns/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: selectedDomainDns.name,
          action: 'add',
          record: {
            type: newDnsType,
            name: newDnsName,
            value: newDnsValue,
            ttl: newDnsTtl
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('DNS record added successfully!', 'success');
        setIsDnsRecordModalOpen(false);
        setNewDnsName('@');
        setNewDnsValue('');
        const updated = data.domains.find((d: any) => d.name === selectedDomainDns.name);
        if (updated) setSelectedDomainDns(updated);
        fetchDomains();
      } else {
        addToast(data.error || 'Failed to add DNS record', 'error');
      }
    } catch (err) {
      addToast('Error adding DNS record', 'error');
    }
  };

  const handleDeleteDnsRecord = async (record: any) => {
    if (!selectedDomainDns) return;
    try {
      const res = await fetch('/api/domains/dns/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: selectedDomainDns.name,
          action: 'delete',
          record
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('DNS record deleted', 'success');
        const updated = data.domains.find((d: any) => d.name === selectedDomainDns.name);
        if (updated) setSelectedDomainDns(updated);
        fetchDomains();
      } else {
        addToast(data.error || 'Failed to delete DNS record', 'error');
      }
    } catch (err) {
      addToast('Error deleting DNS record', 'error');
    }
  };

  const handleSaveRedirect = async () => {
    try {
      const res = await fetch('/api/domains/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: redirectDomainName,
          redirectUrl: redirectUrl || null
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Redirection updated!', 'success');
        setIsRedirectModalOpen(false);
        fetchDomains();
      } else {
        addToast(data.error || 'Failed to save redirect', 'error');
      }
    } catch (err) {
      addToast('Error updating redirection', 'error');
    }
  };

  // Format Helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const commandPaletteItems = [
    { label: 'Go to Dashboard', icon: <Activity size={16} />, action: () => { setActiveTab('dashboard'); } },
    { label: 'Go to File Manager', icon: <FolderOpen size={16} />, action: () => { setActiveTab('files'); } },
    { label: 'Go to Database Manager', icon: <Database size={16} />, action: () => { setActiveTab('databases'); } },
    { label: 'Go to Domain Manager', icon: <Globe size={16} />, action: () => { setActiveTab('domains'); } },
    { label: 'Go to Security Suite', icon: <Shield size={16} />, action: () => { setActiveTab('security'); } },
    { label: 'Go to Email Manager', icon: <Mail size={16} />, action: () => { setActiveTab('emails'); } },
    { label: 'Go to Task Scheduler (Crons)', icon: <Clock size={16} />, action: () => { setActiveTab('crons'); } },
    { label: 'Go to DX & GitOps Deployments', icon: <GitBranch size={16} />, action: () => { setActiveTab('dx'); } },
    { label: 'Create New Database', icon: <Plus size={16} />, action: () => { setActiveTab('databases'); setIsNewDbModalOpen(true); } },
    { label: 'Create New Domain', icon: <Plus size={16} />, action: () => { setActiveTab('domains'); setIsNewDomainModalOpen(true); } },
    { label: 'Schedule New Cron Job', icon: <Plus size={16} />, action: () => { setActiveTab('crons'); setIsNewCronModalOpen(true); } },
    { label: 'Create Email Account', icon: <Plus size={16} />, action: () => { setActiveTab('emails'); setEmailActiveSubTab('accounts'); setIsNewEmailModalOpen(true); } },
    { label: 'Block IP Address', icon: <Shield size={16} />, action: () => { setActiveTab('security'); setSecurityActiveSubTab('ip_blocker'); setIsNewIpBlockModalOpen(true); } },
    { label: 'Add Firewall Rule', icon: <Shield size={16} />, action: () => { setActiveTab('security'); setSecurityActiveSubTab('firewall'); setIsNewFirewallRuleModalOpen(true); } },
    { label: 'Authorize SSH Key', icon: <Shield size={16} />, action: () => { setActiveTab('security'); setSecurityActiveSubTab('ssh'); setIsNewSshKeyModalOpen(true); } },
    { label: 'Go to AI Copilot Dashboard', icon: <Sparkles size={16} />, action: () => { setActiveTab('ai'); } },
    { label: 'AI Log Debugger Analysis', icon: <Sparkles size={16} />, action: () => { setActiveTab('ai'); setAiActiveSubTab('debugger'); } },
    { label: 'AI Config Rewrite Generator', icon: <Sparkles size={16} />, action: () => { setActiveTab('ai'); setAiActiveSubTab('rewrite'); } },
    { label: 'AI Cron Composer Scheduler', icon: <Sparkles size={16} />, action: () => { setActiveTab('ai'); setAiActiveSubTab('composer'); } },
    { label: 'Go to Cloud Integrations', icon: <Layers size={16} />, action: () => { setActiveTab('cloud'); } },
    { label: 'Configure Cloud Backups', icon: <Layers size={16} />, action: () => { setActiveTab('cloud'); setCloudActiveSubTab('backups'); } },
    { label: 'Manage Cloud DNS APIs', icon: <Layers size={16} />, action: () => { setActiveTab('cloud'); setCloudActiveSubTab('dns'); } }
  ];

  const filteredCommands = commandPaletteItems.filter(item =>
    item.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-bg-glow"></div>
        <div className="login-bg-glow-bottom"></div>
        <div style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          width: '350px',
          height: '180px',
          backgroundImage: `url(${logoText})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div className="login-card">
          <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <img src={logoIcon} style={{ width: '64px', height: '64px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }} alt="Logo" />
            <span className="login-title" style={{ 
              fontSize: '1.4rem', 
              letterSpacing: '2px',
              fontFamily: 'Syncopate, sans-serif',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>Keel Panel</span>
          </div>
          <p className="login-subtitle">Sign in to manage your server environment</p>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter tenant username" 
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn">
              Authenticate Account
            </button>
          </form>
        </div>
        
        {/* TOAST SYSTEM POPUPS */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <div className="toast-message">{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <div className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px' }}>
          <img src={logoIcon} style={{ width: '28px', height: '28px', borderRadius: '6px' }} alt="Keel Icon" />
          <span className="logo-text" style={{ fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Keel Panel</span>
        </div>
        <div className="sidebar-nav">
          {(role === 'admin' || role === 'tenant' || role === 'developer' || role === 'dba') && (
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Activity size={18} />
              <span>Dashboard</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant' || role === 'developer') && (
            <div 
              className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              <FolderOpen size={18} />
              <span>File Manager</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant' || role === 'dba') && (
            <div 
              className={`nav-item ${activeTab === 'databases' ? 'active' : ''}`}
              onClick={() => setActiveTab('databases')}
            >
              <Database size={18} />
              <span>Databases</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'domains' ? 'active' : ''}`}
              onClick={() => { setActiveTab('domains'); setSelectedDomainDns(null); }}
            >
              <Globe size={18} />
              <span>Domains & DNS</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} />
              <span>Security Suite</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`}
              onClick={() => setActiveTab('emails')}
            >
              <Mail size={18} />
              <span>Email Manager</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'crons' ? 'active' : ''}`}
              onClick={() => setActiveTab('crons')}
            >
              <Clock size={18} />
              <span>Task Scheduler</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant' || role === 'developer') && (
            <div 
              className={`nav-item ${activeTab === 'dx' ? 'active' : ''}`}
              onClick={() => setActiveTab('dx')}
            >
              <GitBranch size={18} />
              <span>Modern DX & GitOps</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={18} color="#3b82f6" />
              <span>AI Copilot</span>
            </div>
          )}

          {(role === 'admin' || role === 'tenant') && (
            <div 
              className={`nav-item ${activeTab === 'cloud' ? 'active' : ''}`}
              onClick={() => setActiveTab('cloud')}
            >
              <Layers size={18} color="#3b82f6" />
              <span>Cloud Integrations</span>
            </div>
          )}

          {/* Team tab for tenants or collaborator admins */}
          {username !== 'admin' && (role === 'tenant' || role === 'admin') && (
            <div 
              className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <Users size={18} color="#10b981" />
              <span>Team & IAM</span>
            </div>
          )}

          {/* Tenant Manager tab for global admin */}
          {username === 'admin' && (
            <div 
              className={`nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
              onClick={() => setActiveTab('tenants')}
            >
              <Users size={18} color="#3b82f6" />
              <span>Tenant Manager</span>
            </div>
          )}
        </div>
        <div className="sidebar-footer">
          <span>v1.0.0 (Demo Mode)</span>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="main-wrapper">
        <div className="topbar">
          <h2 className="page-title">
            {activeTab === 'dashboard' && 'System Dashboard'}
            {activeTab === 'files' && 'File Manager'}
            {activeTab === 'databases' && 'Database Manager'}
            {activeTab === 'domains' && 'Domains & DNS Manager'}
            {activeTab === 'security' && 'Advanced Security Suite'}
            {activeTab === 'emails' && 'Email Accounts Manager'}
            {activeTab === 'crons' && 'Task Scheduler'}
            {activeTab === 'dx' && 'Modern DX & GitOps'}
            {activeTab === 'ai' && 'AI Operations Copilot'}
            {activeTab === 'cloud' && 'Cloud-Native Integrations'}
            {activeTab === 'team' && 'Team & Collaborators (IAM)'}
            {activeTab === 'tenants' && 'Admin Tenant Manager'}
          </h2>
          <div className="topbar-actions">
            <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="user-profile">
              <div className="user-avatar" style={{ textTransform: 'uppercase' }}>{username ? username[0] : 'U'}</div>
              <span style={{ marginRight: '8px', textTransform: 'capitalize' }}>{username || 'User'} ({role || 'Guest'})</span>
              <button className="btn btn-secondary btn-small" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="content-area fade-in">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {statsLoading ? (
                <div>Loading system diagnostics...</div>
              ) : (
                <>
                  <div className="dashboard-grid">
                    <div className="card primary" onClick={() => setIsCpuCardExpanded(!isCpuCardExpanded)} style={{ cursor: 'pointer', transition: 'max-height 0.3s ease-out' }}>
                      <div className="card-header">
                        <span className="card-title">CPU Load {isCpuCardExpanded ? '(Click to collapse)' : '(Click to expand)'}</span>
                        <Cpu size={18} color="#3b82f6" />
                      </div>
                      <div className="card-value">{stats?.cpu.usage}%</div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${stats?.cpu.usage}%` }}></div>
                      </div>
                      <div className="card-subtext" style={{ marginBottom: isCpuCardExpanded ? '10px' : '0' }}>{stats?.cpu.model} ({stats?.cpu.cores} Cores)</div>
                      
                      {isCpuCardExpanded && stats?.cpu.coreUsage && (
                        <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }} className="fade-in">
                          {stats.cpu.coreUsage.map((coreLoad: number, idx: number) => (
                            <div key={idx} style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span>Core {idx + 1}</span>
                                <strong>{coreLoad}%</strong>
                              </div>
                              <div className="progress-bar-container" style={{ height: '4px', margin: 0 }}>
                                <div className="progress-bar-fill" style={{ width: `${coreLoad}%`, background: 'var(--accent-blue)' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card primary">
                      <div className="card-header">
                        <span className="card-title">Memory Allocation</span>
                        <Layers size={18} color="#8b5cf6" />
                      </div>
                      <div className="card-value">{stats?.memory.percentage}%</div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${stats?.memory.percentage}%` }}></div>
                      </div>
                      <div className="card-subtext">{formatBytes(stats?.memory.used)} / {formatBytes(stats?.memory.total)}</div>
                    </div>

                    <div className="card primary">
                      <div className="card-header">
                        <span className="card-title">Disk Usage</span>
                        <HardDrive size={18} color="#10b981" />
                      </div>
                      <div className="card-value">{stats?.disk.percentage}%</div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${stats?.disk.percentage}%` }}></div>
                      </div>
                      <div className="card-subtext">{formatBytes(stats?.disk.used)} / {formatBytes(stats?.disk.total)}</div>
                    </div>
                  </div>

                  <div className="card" style={{ marginTop: '24px' }}>
                    <div className="card-header">
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Server Environment Overview</h3>
                      <Terminal size={18} color="#94a3b8" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Operating System</div>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{stats?.platform} ({stats?.arch})</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Server Uptime</div>
                        <div style={{ fontWeight: 600 }}>{Math.floor((stats?.uptime || 0) / 3600)} Hours, {Math.floor(((stats?.uptime || 0) % 3600) / 60)} Mins</div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ marginTop: '24px' }}>
                    <div className="card-header">
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Modern Web Stack Selector</h3>
                      <Layers size={18} color="#3b82f6" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Switch the active reverse-proxy web server stack. View lightweight alternatives and their RAM footprints.
                      </p>
                      {webstackLoading ? (
                        <div style={{ fontSize: '0.875rem' }}>Querying active web stack...</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          {webstackInfo?.engines?.map((eng: any) => (
                            <div 
                              key={eng.name}
                              style={{
                                padding: '16px',
                                borderRadius: '8px',
                                background: eng.status === 'active' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                                border: eng.status === 'active' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => eng.status !== 'active' && handleSwitchWebstack(eng.name)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{eng.name}</span>
                                {eng.status === 'active' && (
                                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#3b82f6', color: '#fff', borderRadius: '4px' }}>Active</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                {eng.description}
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                RAM Footprint: <span style={{ color: eng.name === 'apache' ? '#ef4444' : '#10b981' }}>{eng.memory}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: FILE MANAGER */}
          {activeTab === 'files' && (
            <div className="file-manager-wrapper">
              <div className="file-toolbar">
                <div className="breadcrumb-container">
                  <span className="breadcrumb-item" onClick={() => fetchFiles('')}>sandbox</span>
                  {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
                    <span key={arr.slice(0, i + 1).join('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ChevronRight size={14} style={{ margin: '0 4px' }} />
                      <span 
                        className="breadcrumb-item"
                        onClick={() => fetchFiles(arr.slice(0, i + 1).join('/'))}
                      >
                        {part}
                      </span>
                    </span>
                  ))}
                </div>

                <div className="file-toolbar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {currentPath && (
                    <button className="btn btn-secondary btn-small" onClick={handleBackClick}>
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                  <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                    <Upload size={14} style={{ marginRight: '4px' }} /> Upload
                    <input type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
                  </label>
                  <button className="btn btn-primary btn-small" onClick={() => setIsNewFileModalOpen(true)}>
                    <Plus size={14} /> New File/Folder
                  </button>
                </div>
              </div>

              {filesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Syncing filesystem content...</div>
              ) : (
                <div 
                  className="file-grid"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ border: '2px dashed transparent', transition: 'border-color 0.2s' }}
                >
                  {files.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      This folder is empty. Drag & drop files here to upload.
                    </div>
                  ) : (
                    files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="file-item"
                        onClick={() => file.isDirectory ? handleFolderClick(file.name) : handleOpenFile(file)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {file.isDirectory ? (
                            <Folder size={44} color="#3b82f6" fill="#3b82f6" style={{ opacity: 0.8 }} />
                          ) : (
                            <FileText size={44} color="#94a3b8" />
                          )}
                          <span className="file-name" title={file.name}>{file.name}</span>
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span className="file-size" style={{ fontSize: '0.75rem' }}>{file.isDirectory ? 'Folder' : formatBytes(file.size)}</span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button 
                              className="btn-icon" 
                              style={{ width: '26px', height: '26px', border: 'none', padding: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setChmodPath(currentPath ? `${currentPath}/${file.name}` : file.name);
                                setChmodMode(file.permissions || '755');
                                setIsChmodModalOpen(true);
                              }}
                              title="Permissions (Chmod)"
                            >
                              <Sliders size={13} color="#94a3b8" />
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ width: '26px', height: '26px', border: 'none', padding: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompressPath(currentPath ? `${currentPath}/${file.name}` : file.name);
                                setCompressArchiveName(`${file.name}.zip`);
                                setIsCompressModalOpen(true);
                              }}
                              title="Compress Folder/File"
                            >
                              <Archive size={13} color="#94a3b8" />
                            </button>
                            {(file.name.endsWith('.zip') || file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz')) && (
                              <button 
                                className="btn-icon" 
                                style={{ width: '26px', height: '26px', border: 'none', padding: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDecompressPath(currentPath ? `${currentPath}/${file.name}` : file.name);
                                  setDecompressDestPath(currentPath);
                                  setIsDecompressModalOpen(true);
                                }}
                                title="Decompress Archive"
                              >
                                <FolderOutput size={13} color="#94a3b8" />
                              </button>
                            )}
                            <button 
                              className="btn-icon" 
                              style={{ width: '26px', height: '26px', border: 'none', padding: 0 }}
                              onClick={(e) => handleDeleteFileOrFolder(file.name, e)}
                              title="Delete file"
                            >
                              <Trash2 size={13} color="#ef4444" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATABASES */}
          {activeTab === 'databases' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Active Databases</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-small" onClick={() => { setIsAdminerOpen(true); setIsAdminerInstalled(false); setAdminerDomain(''); }}>
                    Adminer Manager (SSO)
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={() => { setIsWizardOpen(true); setWizardStep(1); setWizardDbName(''); setWizardUsername(''); }}>
                    Database Wizard
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={() => setIsNewDbUserModalOpen(true)}>
                    <Plus size={14} /> Create User
                  </button>
                  <button className="btn btn-primary btn-small" onClick={() => setIsNewDbModalOpen(true)}>
                    <Plus size={14} /> Create Database
                  </button>
                </div>
              </div>

              {dbLoading ? (
                <div>Retrieving SQL engines...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Database List */}
                  <div className="card">
                    <div className="db-table-container">
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Database Name</th>
                            <th>Engine Type</th>
                            <th>Storage Size</th>
                            <th>Access Users</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {databases.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No active databases found</td>
                            </tr>
                          ) : (
                            databases.map((db, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{db.name}</td>
                                <td><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: '4px' }}>{db.type}</span></td>
                                <td>{db.size}</td>
                                <td>
                                  {db.users.length === 0 ? (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No user access</span>
                                  ) : (
                                    db.users.map((u: string, idx: number) => (
                                      <span key={idx} className="db-user-badge">{u}</span>
                                    ))
                                  )}
                                  <button 
                                    className="btn btn-secondary btn-small" 
                                    style={{ padding: '2px 6px', fontSize: '0.7rem', display: 'inline-flex' }}
                                    onClick={() => { setAssociateDb(db.name); setIsAssociateModalOpen(true); }}
                                  >
                                    Add user
                                  </button>
                                </td>
                                <td>
                                  <button className="btn-icon" onClick={() => handleDeleteDatabase(db.name)}>
                                    <Trash2 size={14} color="#ef4444" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DB User List */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Database Access Credentials</h3>
                    <div className="card">
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Allowed Host Interfaces</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbUsers.map((u, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{u.username}</td>
                              <td>{u.hosts.join(', ')}</td>
                              <td>
                                <button className="btn-icon" onClick={() => handleDeleteDbUser(u.username)}>
                                  <Trash2 size={14} color="#ef4444" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOMAINS & DNS */}
          {activeTab === 'domains' && (
            <div>
              {selectedDomainDns ? (
                // DNS ZONE WRITER SUB-VIEW
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button className="btn btn-secondary btn-small" onClick={() => setSelectedDomainDns(null)}>
                      <ArrowLeft size={14} /> Back to Domains
                    </button>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>DNS Zone Records for: {selectedDomainDns.name}</h3>
                  </div>

                  <div className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Configure Zone Records</h4>
                      <button className="btn btn-primary btn-small" onClick={() => { setNewDnsType('A'); setNewDnsName('@'); setNewDnsValue(''); setIsDnsRecordModalOpen(true); }}>
                        <Plus size={14} /> Add DNS Record
                      </button>
                    </div>

                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Record Name</th>
                          <th>Type</th>
                          <th>Value / Target</th>
                          <th>TTL</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDomainDns.dnsRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No DNS zone records configured.</td>
                          </tr>
                        ) : (
                          selectedDomainDns.dnsRecords.map((rec: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{rec.name}</td>
                              <td><span className="db-user-badge">{rec.type}</span></td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{rec.value}</td>
                              <td>{rec.ttl}s</td>
                              <td>
                                <button className="btn-icon" onClick={() => handleDeleteDnsRecord(rec)} title="Delete record">
                                  <Trash2 size={14} color="#ef4444" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // DOMAINS DASHBOARD LIST
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Registered Domains & Subdomains</h3>
                    <button className="btn btn-primary btn-small" onClick={() => { setNewDomainName(''); setNewDomainDocroot(''); setNewDomainRedirect(''); setIsNewDomainModalOpen(true); }}>
                      <Plus size={14} /> Add Domain
                    </button>
                  </div>

                  {domainsLoading ? (
                    <div>Loading active domains...</div>
                  ) : (
                    <>
                      <div className="card">
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Domain / Subdomain</th>
                            <th>Virtual Host Engine</th>
                            <th>Status</th>
                            <th>Redirection Target</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {domains.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No domains registered.</td>
                            </tr>
                          ) : (
                            domains.map((dom: any, idx: number) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600 }}>
                                  {dom.name}
                                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Root: <span style={{ fontFamily: 'monospace' }}>{dom.docroot}</span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: '4px' }}>
                                    {dom.engine} (PHP {dom.phpVersion})
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-badge ${dom.status === 'enabled' ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                                    {dom.status}
                                  </span>
                                </td>
                                <td>
                                  {dom.redirectUrl ? (
                                    <span style={{ color: '#3b82f6', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Link size={12} /> {dom.redirectUrl}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No Redirect</span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <a href={`http://${dom.name}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                      <ExternalLink size={12} /> Visit
                                    </a>
                                    <a href={`${window.location.protocol}//${window.location.hostname}:3001/preview/${dom.name}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                      <Globe size={12} /> Preview
                                    </a>
                                    <button className="btn btn-secondary btn-small" onClick={() => setSelectedDomainDns(dom)}>
                                      DNS Records
                                    </button>
                                    <button className="btn btn-secondary btn-small" onClick={() => { setRedirectDomainName(dom.name); setRedirectUrl(dom.redirectUrl || ''); setIsRedirectModalOpen(true); }}>
                                      Redirect
                                    </button>
                                    <button className="btn btn-secondary btn-small" onClick={() => handleToggleVh(dom.name)}>
                                      {dom.status === 'enabled' ? 'Disable' : 'Enable'}
                                    </button>
                                    <button className="btn-icon" onClick={() => handleDeleteDomain(dom.name)}>
                                      <Trash2 size={14} color="#ef4444" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Uptime Monitors & Self-Healing Card */}
                    <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>HTTP Uptime Monitors & Self-Healing</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure automated ping monitors for your subdomains. Enabled loops automatically repair crashed proxy servers or application engines.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <input 
                              type="checkbox" 
                              checked={autoHealingEnabled} 
                              onChange={e => setAutoHealingEnabled(e.target.checked)} 
                            />
                            Auto-Healing Trigger
                          </label>
                          <button className="btn btn-primary" onClick={() => setIsNewMonitorModalOpen(true)}>Add Domain Check</button>
                        </div>
                      </div>

                      <div className="db-table-container">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Domain Name</th>
                              <th>Uptime Status</th>
                              <th>Check History (Last 5 Pings)</th>
                              <th>Last Monitored</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {healthMonitorsList.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active uptime checks.</td>
                              </tr>
                            ) : (
                              healthMonitorsList.map((m, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{m.domain}</td>
                                  <td>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      background: m.status.startsWith('healthy') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      color: m.status.startsWith('healthy') ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                      {m.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      {m.pings.map((code: number, i: number) => (
                                        <span 
                                          key={i} 
                                          title={`HTTP Status: ${code}`}
                                          style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: code === 200 ? 'var(--success)' : 'var(--danger)',
                                            display: 'inline-block'
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(m.lastCheck).toLocaleTimeString()}</td>
                                  <td>
                                    <button className="btn-icon" onClick={() => handleDeleteMonitor(m.domain)}>
                                      <Trash2 size={14} color="#ef4444" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY SUITE */}
          {activeTab === 'security' && (
            <div>
              {/* Tabs Selector */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '1px' }}>
                <button 
                  className={`btn ${securityActiveSubTab === 'firewall' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('firewall')}
                >
                  Firewall (UFW)
                </button>
                <button 
                  className={`btn ${securityActiveSubTab === 'ip_blocker' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('ip_blocker')}
                >
                  IP Blocker
                </button>
                <button 
                  className={`btn ${securityActiveSubTab === 'ssh' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('ssh')}
                >
                  SSH Keys
                </button>
                <button 
                  className={`btn ${securityActiveSubTab === 'ssl' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('ssl')}
                >
                  SSL Certs
                </button>
                <button 
                  className={`btn ${securityActiveSubTab === 'hotlink' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('hotlink')}
                >
                  Hotlink Protection
                </button>
                <button 
                  className={`btn ${securityActiveSubTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setSecurityActiveSubTab('logs')}
                >
                  Log Stream & Webhooks
                </button>
              </div>

              {securityLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Syncing security status...</div>
              ) : (
                <div>
                  {/* SUB TAB: FIREWALL */}
                  {securityActiveSubTab === 'firewall' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>System Firewall Controller</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage open system ports and protocol access rules</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.88rem' }}>Status: 
                            <strong style={{ marginLeft: '6px', color: firewallStatus === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                              {firewallStatus.toUpperCase()}
                            </strong>
                          </span>
                          <button className={`btn btn-small ${firewallStatus === 'active' ? 'btn-secondary' : 'btn-primary'}`} onClick={handleToggleFirewall}>
                            {firewallStatus === 'active' ? 'Disable Firewall' : 'Enable Firewall'}
                          </button>
                          <button className="btn btn-primary btn-small" onClick={() => setIsNewFirewallRuleModalOpen(true)}>
                            <Plus size={14} /> Add Rule
                          </button>
                        </div>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Index</th>
                                <th>To (Port/Service)</th>
                                <th>Action</th>
                                <th>From (Source)</th>
                                <th>Comment</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {firewallRules.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active firewall rules found.</td>
                                </tr>
                              ) : (
                                firewallRules.map((rule, idx) => (
                                  <tr key={idx}>
                                    <td style={{ color: 'var(--text-secondary)' }}>{rule.index || idx + 1}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{rule.to}</td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        background: rule.action === 'ALLOW' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: rule.action === 'ALLOW' ? 'var(--success)' : 'var(--danger)'
                                      }}>
                                        {rule.action}
                                      </span>
                                    </td>
                                    <td>{rule.from}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{rule.comment || 'System Default'}</td>
                                    <td>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => handleDeleteFirewallRule(rule.index, rule.to)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: IP BLOCKER */}
                  {securityActiveSubTab === 'ip_blocker' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>IP Access Blocker</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restrict access from specific IP addresses or IP ranges (CIDR)</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={() => setIsNewIpBlockModalOpen(true)}>
                          <Plus size={14} /> Block IP
                        </button>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>IP / CIDR Block</th>
                                <th>Block Reason</th>
                                <th>Date Restricted</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blockedIps.length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No IP restriction records found.</td>
                                </tr>
                              ) : (
                                blockedIps.map((block, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{block.ip}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{block.reason}</td>
                                    <td>{block.date}</td>
                                    <td>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => handleDeleteIpBlock(block.ip)}>
                                        <Trash2 size={14} color="var(--success)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: SSH KEY MANAGER */}
                  {securityActiveSubTab === 'ssh' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>SSH Key Manager</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deploy and manage SSH public keys to allow secure passwordless login to your environment</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={() => setIsNewSshKeyModalOpen(true)}>
                          <Plus size={14} /> Add SSH Key
                        </button>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Key Name</th>
                                <th>Key Type</th>
                                <th>Fingerprint</th>
                                <th>Owner</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sshKeys.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No authorized SSH keys found.</td>
                                </tr>
                              ) : (
                                sshKeys.map((key, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{key.name}</td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 6px', 
                                        background: 'var(--bg-surface)', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        textTransform: 'uppercase' 
                                      }}>
                                        {key.keyType}
                                      </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{key.fingerprint}</td>
                                    <td>{key.owner}</td>
                                    <td>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => handleDeleteSshKey(key.name)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: SSL CERTS */}
                  {securityActiveSubTab === 'ssl' && (
                    <div className="fade-in">
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Let's Encrypt Certificate Authority Status</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track expiry dates and force manual renewals of domain SSL certificates</p>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Domain Name</th>
                                <th>Issuer Authority</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Auto-Renew</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sslStatus.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No domains registered to track.</td>
                                </tr>
                              ) : (
                                sslStatus.map((ssl, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{ssl.domain}</td>
                                    <td>{ssl.issuer}</td>
                                    <td style={{ color: ssl.status === 'valid' ? 'var(--text-primary)' : 'var(--danger)' }}>{ssl.expiry}</td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        background: ssl.status === 'valid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: ssl.status === 'valid' ? 'var(--success)' : 'var(--danger)'
                                      }}>
                                        {ssl.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                                      <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Enabled
                                    </td>
                                    <td>
                                      <button className="btn btn-secondary btn-small" onClick={() => handleRenewSsl(ssl.domain)}>
                                        <RefreshCw size={12} /> Force Renew
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: HOTLINK */}
                  {securityActiveSubTab === 'hotlink' && (
                    <div className="fade-in">
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Hotlink Protection Suite</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prevent external domains from scraping or directly embedding your hosted media files</p>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Domain</th>
                                <th>Scope Protected Extensions</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hotlinkStatus.length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No domains registered to track.</td>
                                </tr>
                              ) : (
                                hotlinkStatus.map((hl, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{hl.domain}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>.jpg, .jpeg, .png, .gif, .svg, .webp, .mp4, .webm</td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        background: hl.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: hl.enabled ? 'var(--success)' : 'var(--warning)'
                                      }}>
                                        {hl.enabled ? 'PROTECTED' : 'UNPROTECTED'}
                                      </span>
                                    </td>
                                    <td>
                                      <button className={`btn btn-small ${hl.enabled ? 'btn-secondary' : 'btn-primary'}`} onClick={() => handleToggleHotlink(hl.domain)}>
                                        {hl.enabled ? 'Disable Protection' : 'Enable Protection'}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: LOG STREAM & WEBHOOK ALERTS */}
                  {securityActiveSubTab === 'logs' && (
                    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                      <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>System Logs Aggregator</h4>
                          <button className="btn btn-secondary btn-small" onClick={fetchSecurityData}>Refresh Logs</button>
                        </div>
                        <div style={{
                          background: '#0a0a0c',
                          padding: '16px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {systemLogsList.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No logs streamed yet.</div>
                          ) : (
                            systemLogsList.map((log, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span style={{
                                  color: log.level === 'error' ? '#ef4444' : log.level === 'warning' ? '#f59e0b' : 'var(--accent-blue)',
                                  fontWeight: 600
                                }}>
                                  {log.service.toUpperCase()}:
                                </span>
                                <span style={{ color: log.level === 'error' ? '#fca5a5' : '#e2e8f0' }}>{log.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="card" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Active Alert Rules</h4>
                            <button className="btn btn-primary btn-small" onClick={() => setIsNewAlertModalOpen(true)}>Create Alert</button>
                          </div>
                          <div className="db-table-container">
                            <table className="db-table">
                              <thead>
                                <tr>
                                  <th>Rule Name</th>
                                  <th>Trigger</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {alertRulesList.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No alerts rules configured.</td>
                                  </tr>
                                ) : (
                                  alertRulesList.map((rule) => (
                                    <tr key={rule.id}>
                                      <td style={{ fontWeight: 600 }}>{rule.name}</td>
                                      <td><code style={{ fontSize: '0.8rem' }}>{rule.trigger}</code></td>
                                      <td>
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          background: rule.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                          color: rule.enabled ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                          {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EMAIL MANAGER */}
          {activeTab === 'emails' && (
            <div>
              {/* Tabs Selector */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '1px' }}>
                <button 
                  className={`btn ${emailActiveSubTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setEmailActiveSubTab('accounts')}
                >
                  Email Accounts
                </button>
                <button 
                  className={`btn ${emailActiveSubTab === 'forwarders' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setEmailActiveSubTab('forwarders')}
                >
                  Forwarders
                </button>
                <button 
                  className={`btn ${emailActiveSubTab === 'autoresponders' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setEmailActiveSubTab('autoresponders')}
                >
                  Autoresponders
                </button>
                <button 
                  className={`btn ${emailActiveSubTab === 'spam' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
                  onClick={() => setEmailActiveSubTab('spam')}
                >
                  Spam Filter
                </button>

              </div>

              {emailsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Connecting to Postfix/Dovecot services...</div>
              ) : (
                <div>
                  {/* SUB TAB: EMAIL ACCOUNTS */}
                  {emailActiveSubTab === 'accounts' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Email Mailboxes</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create and manage IMAP/POP3 mailboxes for your hosted domains</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={() => {
                          setNewEmailLocal('');
                          setNewEmailPassword('');
                          if (domains.length > 0) {
                            setNewEmailDomain(domains[0].name);
                          }
                          setIsNewEmailModalOpen(true);
                        }}>
                          <Plus size={14} /> Create Account
                        </button>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Email Address</th>
                                <th>Storage Allocated</th>
                                <th>Space Used</th>
                                <th>Owner</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emailsList.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active email mailboxes configured.</td>
                                </tr>
                              ) : (
                                emailsList.map((mail, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{mail.email}</td>
                                    <td>{mail.quota}</td>
                                    <td>{mail.used}</td>
                                    <td>{mail.owner}</td>
                                    <td>
                                      <button 
                                        className="btn btn-secondary btn-small" 
                                        style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        onClick={() => {
                                          window.open(`http://${window.location.hostname}:3002?email=${encodeURIComponent(mail.email)}&token=${encodeURIComponent(token)}`, '_blank');
                                        }}
                                      >
                                        <Mail size={12} />
                                        <span>Webmail ↗</span>
                                      </button>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px', verticalAlign: 'middle' }} onClick={() => handleDeleteEmail(mail.email)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: FORWARDERS */}
                  {emailActiveSubTab === 'forwarders' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Email Forwarding Rules</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Route incoming emails from one mailbox to an external destination</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={() => {
                          setNewForwarderSource('');
                          setNewForwarderDest('');
                          setIsNewForwarderModalOpen(true);
                        }}>
                          <Plus size={14} /> Add Forwarder
                        </button>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Source Email</th>
                                <th>Forwarding Target</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {forwardersList.length === 0 ? (
                                <tr>
                                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active forwarding rules.</td>
                                </tr>
                              ) : (
                                forwardersList.map((fwd, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{fwd.source}</td>
                                    <td>{fwd.destination}</td>
                                    <td>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => handleDeleteForwarder(fwd.source, fwd.destination)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: AUTORESPONDERS */}
                  {emailActiveSubTab === 'autoresponders' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Out of Office Auto-Replies</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure automated reply emails for vacation or standard info responders</p>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={() => {
                          if (emailsList.length > 0) {
                            setNewAutoresponderEmail(emailsList[0].email);
                          }
                          setNewAutoresponderSubject('Out of Office');
                          setNewAutoresponderMessage('');
                          setIsNewAutoresponderModalOpen(true);
                        }}>
                          <Plus size={14} /> Add Autoresponder
                        </button>
                      </div>

                      <div className="card">
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Email Address</th>
                                <th>Auto-Reply Subject</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {autorespondersList.length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No autoresponders configured.</td>
                                </tr>
                              ) : (
                                autorespondersList.map((auto, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{auto.email}</td>
                                    <td>{auto.subject}</td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        background: auto.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: auto.enabled ? 'var(--success)' : 'var(--danger)'
                                      }}>
                                        {auto.enabled ? 'ACTIVE' : 'DISABLED'}
                                      </span>
                                    </td>
                                    <td>
                                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => handleDeleteAutoresponder(auto.email)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: SPAM FILTER */}
                  {emailActiveSubTab === 'spam' && (
                    <div className="fade-in">
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>SpamAssassin Anti-Spam Suite</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protect your mail server using SpamAssassin heuristics and scoring blocks</p>
                      </div>

                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enable SpamAssassin filter</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Analyze and score incoming emails to isolate spam</span>
                          </div>
                          <button 
                            className={`btn ${spamSettings.enabled ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleToggleSpamFilter}
                          >
                            {spamSettings.enabled ? 'Disable Spam Filter' : 'Enable Spam Filter'}
                          </button>
                        </div>

                        {spamSettings.enabled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
                            <div className="form-group">
                              <label className="form-label">Spam Score Threshold (Standard is 5.0)</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input 
                                  type="range" 
                                  min="1" 
                                  max="10" 
                                  step="0.5"
                                  className="form-input" 
                                  value={spamSettings.scoreThreshold}
                                  onChange={e => handleSaveSpamConfig(parseFloat(e.target.value), spamSettings.autoDelete)}
                                  style={{ flex: 1 }}
                                />
                                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-blue)', minWidth: '40px', textAlign: 'center' }}>
                                  {spamSettings.scoreThreshold}
                                </strong>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Lower threshold blocks more spam (but risks false positives). Higher threshold is more relaxed.
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                              <input 
                                type="checkbox" 
                                id="autoDeleteSpam"
                                checked={spamSettings.autoDelete}
                                onChange={e => handleSaveSpamConfig(spamSettings.scoreThreshold, e.target.checked)}
                              />
                              <label htmlFor="autoDeleteSpam" style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                                Automatically delete spam emails scoring above the threshold
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* TAB 7: TASK SCHEDULER */}
          {activeTab === 'crons' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Cron Jobs & Task Scheduler</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-small" onClick={() => { fetchCronLogs(); setIsLogsModalOpen(true); }}>
                    View Execution Logs
                  </button>
                  <button className="btn btn-primary btn-small" onClick={() => {
                    setNewCronCommand('');
                    setNewCronDesc('');
                    setNewCronSchedule('* * * * *');
                    setCronPreset('custom');
                    setIsNewCronModalOpen(true);
                  }}>
                    <Plus size={14} /> Add Cron Job
                  </button>
                </div>
              </div>

              {cronsLoading ? (
                <div>Retrieving scheduled tasks...</div>
              ) : (
                <div className="card">
                  <div className="db-table-container">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Schedule</th>
                          <th>Command</th>
                          <th>Description</th>
                          <th>Owner</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cronsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No scheduled cron jobs found.</td>
                          </tr>
                        ) : (
                          cronsList.map((cron, idx) => (
                            <tr key={cron.id || idx}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{cron.schedule}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cron.command}</td>
                              <td>{cron.description || <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>None</span>}</td>
                              <td>{cron.owner}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    className="btn btn-secondary btn-small"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    onClick={() => handleExecuteCron(cron.id)}
                                    disabled={isExecutingCron === cron.id}
                                  >
                                    {isExecutingCron === cron.id ? 'Running...' : 'Execute Now'}
                                  </button>
                                  <button 
                                    className="btn-icon" 
                                    onClick={() => handleDeleteCron(cron.id)}
                                    title="Delete task"
                                  >
                                    <Trash2 size={14} color="#ef4444" style={{ display: 'block', margin: 'auto' }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* TAB 8: MODERN DX & GITOPS */}
          {activeTab === 'dx' && (
            <div>
              {/* Tab Navigation header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="sub-tab-nav" style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <button 
                    className={`btn btn-small ${dxActiveSubTab === 'git' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => setDxActiveSubTab('git')}
                  >
                    Git Deployments
                  </button>
                  <button 
                    className={`btn btn-small ${dxActiveSubTab === 'apps' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => setDxActiveSubTab('apps')}
                  >
                    App Manager (Runtimes)
                  </button>
                  <button 
                    className={`btn btn-small ${dxActiveSubTab === 'containers' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => setDxActiveSubTab('containers')}
                  >
                    Containers (Docker)
                  </button>
                  <button 
                    className={`btn btn-small ${dxActiveSubTab === 'api' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => setDxActiveSubTab('api')}
                  >
                    Developer API Tokens
                  </button>
                </div>

                <div>
                  {dxActiveSubTab === 'git' && (
                    <button className="btn btn-primary btn-small" onClick={() => setIsNewProjectModalOpen(true)}>
                      <Plus size={14} /> Link Git Repo
                    </button>
                  )}
                  {dxActiveSubTab === 'apps' && (
                    <button className="btn btn-primary btn-small" onClick={() => setIsNewAppModalOpen(true)}>
                      <Plus size={14} /> Register App
                    </button>
                  )}
                  {dxActiveSubTab === 'containers' && (
                    <button className="btn btn-primary btn-small" onClick={() => setIsLaunchContainerModalOpen(true)}>
                      <Plus size={14} /> Launch Custom Image
                    </button>
                  )}
                </div>
              </div>

              {dxLoading ? (
                <div>Synchronizing deployment systems...</div>
              ) : (
                <div className="fade-in">
                  
                  {/* SUB TAB: GIT DEPLOYMENTS */}
                  {dxActiveSubTab === 'git' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {gitDeployments.length === 0 ? (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No linked Git repositories found. Connect a repository to start continuous delivery.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                          {gitDeployments.map((proj) => (
                            <div key={proj.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{proj.name}</h4>
                                  <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    background: proj.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : proj.status === 'building' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: proj.status === 'success' ? 'var(--success)' : proj.status === 'building' ? 'var(--warning)' : 'var(--danger)'
                                  }}>
                                    {proj.status.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <GitBranch size={12} />
                                  <span>{proj.repoUrl} (branch: <strong>{proj.branch}</strong>)</span>
                                </div>
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.8rem' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Last Commit: {proj.lastCommit?.hash || 'N/A'}</div>
                                  <div style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>"{proj.lastCommit?.message || 'Deploy trigger'}"</div>
                                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>by {proj.lastCommit?.author || 'system'}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                <button className="btn btn-secondary btn-small" style={{ flex: 1 }} onClick={() => setViewingBuildLogsProj(proj)}>
                                  View Build Logs
                                </button>
                                <button className="btn btn-primary btn-small" style={{ flex: 1 }} onClick={() => handleRedeployProject(proj.id)}>
                                  Trigger Deploy
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB TAB: APP RUNTIME MANAGER */}
                  {dxActiveSubTab === 'apps' && (
                    <div className="card">
                      <div className="db-table-container">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>App Name</th>
                              <th>Runtime</th>
                              <th>Status</th>
                              <th>Port Binding</th>
                              <th>CPU Usage</th>
                              <th>Memory</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registeredApps.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active applications registered.</td>
                              </tr>
                            ) : (
                              registeredApps.map((app) => (
                                <tr key={app.id}>
                                  <td style={{ fontWeight: 600 }}>{app.name}</td>
                                  <td><span className="db-user-badge" style={{ textTransform: 'uppercase' }}>{app.runtime}</span></td>
                                  <td>
                                    <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '4px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: 600,
                                      background: app.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      color: app.status === 'online' ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                      {app.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ fontFamily: 'monospace' }}>:{app.port}</td>
                                  <td>{app.cpu}%</td>
                                  <td>{app.memory}</td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      {app.status === 'online' ? (
                                        <button className="btn btn-secondary btn-small" onClick={() => handleAppAction(app.id, 'stop')}>Stop</button>
                                      ) : (
                                        <button className="btn btn-primary btn-small" onClick={() => handleAppAction(app.id, 'start')}>Start</button>
                                      )}
                                      <button className="btn btn-secondary btn-small" onClick={() => handleAppAction(app.id, 'restart')}>Restart</button>
                                      <button className="btn-icon" onClick={() => handleAppAction(app.id, 'delete')}>
                                        <Trash2 size={14} color="#ef4444" style={{ display: 'block', margin: 'auto' }} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: CONTAINERS */}
                  {dxActiveSubTab === 'containers' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      {/* Marketplace Templates Grid */}
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>One-Click Container Marketplace</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                          {[
                            { name: 'Redis Cache', image: 'redis:alpine', desc: 'In-memory data store', port: '6379:6379' },
                            { name: 'PostgreSQL DB', image: 'postgres:alpine', desc: 'Relational DB server', port: '5432:5432' },
                            { name: 'Ghost Blog', image: 'ghost:alpine', desc: 'Modern publishing platform', port: '2368:2368' },
                            { name: 'Node-RED', image: 'nodered/node-red', desc: 'Flow-based event builder', port: '1880:1880' },
                            { name: 'WordPress CMS', image: 'wordpress:latest', desc: 'Classic publishing CMS', port: '8080:80' }
                          ].map((tmpl, idx) => (
                            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'var(--bg-surface)' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{tmpl.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{tmpl.desc}</div>
                              <button 
                                className="btn btn-primary btn-small" 
                                style={{ width: '100%', marginTop: 'auto', fontSize: '0.75rem', padding: '4px' }}
                                onClick={() => {
                                  setLaunchContainerName(tmpl.name.toLowerCase().replace(/\s+/g, '-'));
                                  setLaunchContainerImage(tmpl.image);
                                  setLaunchContainerPorts(tmpl.port);
                                  setIsLaunchContainerModalOpen(true);
                                }}
                              >
                                Launch
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Running Containers List */}
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Running Containers</h4>
                        <div className="card">
                          <div className="db-table-container">
                            <table className="db-table">
                              <thead>
                                <tr>
                                  <th>Container Name</th>
                                  <th>Image Tag</th>
                                  <th>Status</th>
                                  <th>Ports</th>
                                  <th>CPU %</th>
                                  <th>Memory</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {launchedContainers.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No containers launched yet.</td>
                                  </tr>
                                ) : (
                                  launchedContainers.map((cont) => (
                                    <tr key={cont.id}>
                                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{cont.name}</td>
                                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cont.image}</td>
                                      <td>
                                        <span style={{ 
                                          padding: '2px 8px', 
                                          borderRadius: '4px', 
                                          fontSize: '0.75rem', 
                                          fontWeight: 600,
                                          background: cont.status === 'running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                          color: cont.status === 'running' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                          {cont.status.toUpperCase()}
                                        </span>
                                      </td>
                                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{cont.portBindings}</td>
                                      <td>{cont.cpu}%</td>
                                      <td>{cont.memory}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          {cont.status === 'running' ? (
                                            <button className="btn btn-secondary btn-small" onClick={() => handleContainerAction(cont.id, 'stop')}>Stop</button>
                                          ) : (
                                            <button className="btn btn-primary btn-small" onClick={() => handleContainerAction(cont.id, 'start')}>Start</button>
                                          )}
                                          <button className="btn btn-secondary btn-small" onClick={() => handleContainerAction(cont.id, 'restart')}>Restart</button>
                                          <button className="btn-icon" onClick={() => handleContainerAction(cont.id, 'delete')}>
                                            <Trash2 size={14} color="#ef4444" style={{ display: 'block', margin: 'auto' }} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Private Container Registries Credentials Card */}
                      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Private Container Registries</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage authenticated access to private Docker Hub, GitHub Container Registry (GHCR), or custom registries.</p>
                          </div>
                          <button className="btn btn-primary" onClick={() => setIsNewRegistryModalOpen(true)}>Link Private Registry</button>
                        </div>
                        <div className="db-table-container">
                          <table className="db-table">
                            <thead>
                              <tr>
                                <th>Registry Name</th>
                                <th>URL Endpoint</th>
                                <th>Username</th>
                                <th>Token / Secret</th>
                                <th>Linked Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {registriesList.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No private registries configured yet.</td>
                                </tr>
                              ) : (
                                registriesList.map((reg) => (
                                  <tr key={reg.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{reg.name}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{reg.url}</td>
                                    <td>{reg.username}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{reg.token}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(reg.created).toLocaleDateString()}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB: DEVELOPER API TOKENS */}
                  {dxActiveSubTab === 'api' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Generate Developer API Token</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                          Create secure authentication tokens to authorize external integrations, webhooks, or the Keel command-line interface (CLI) to manage your server resources.
                        </p>
                        
                        <form onSubmit={handleGenerateDeveloperToken} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', maxWidth: '600px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                              Token Label / Description
                            </label>
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g., Local Dev Machine CLI" 
                              value={newDeveloperTokenLabel} 
                              onChange={(e) => setNewDeveloperTokenLabel(e.target.value)} 
                              style={{ width: '100%' }}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                            Generate Token
                          </button>
                        </form>

                        {newlyCreatedToken && (
                          <div style={{ 
                            marginTop: '24px', 
                            padding: '16px', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.3)', 
                            borderRadius: 'var(--radius-sm)' 
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: '0.9rem', marginBottom: '8px' }}>
                              Token Generated Successfully!
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                              Make sure to copy your developer API token now. You won't be able to see it again!
                            </p>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              background: 'var(--bg-primary)', 
                              padding: '8px 12px', 
                              borderRadius: 'var(--radius-sm)', 
                              border: '1px solid var(--border-color)',
                              fontFamily: 'monospace',
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              overflowX: 'auto'
                            }}>
                              <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{newlyCreatedToken}</span>
                              <button 
                                className="btn btn-secondary btn-small"
                                onClick={() => {
                                  navigator.clipboard.writeText(newlyCreatedToken);
                                  addToast('Token copied to clipboard', 'info');
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Active API Access Tokens</h4>
                        {developerTokensLoading ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading access tokens...</div>
                        ) : developerTokensList.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                            No active developer API tokens found. Generate one above to configure the Keel CLI.
                          </div>
                        ) : (
                          <div className="db-table-container">
                            <table className="db-table">
                              <thead>
                                <tr>
                                  <th>Description / Label</th>
                                  <th>Prefix (Identifier)</th>
                                  <th>Created Date</th>
                                  <th>Last Active</th>
                                  <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {developerTokensList.map((tok) => (
                                  <tr key={tok.token}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tok.label}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {tok.token.substring(0, 8)}...
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {new Date(tok.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {tok.lastUsedAt ? new Date(tok.lastUsedAt).toLocaleString() : 'Never'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <button 
                                        className="btn btn-danger-outline btn-small"
                                        onClick={() => handleRevokeDeveloperToken(tok.token)}
                                      >
                                        Revoke
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 9: AI OPERATIONS COPILOT */}
          {activeTab === 'ai' && (
            <div className="fade-in">
              {/* Sub-tab navigation */}
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '24px', maxWidth: '450px' }}>
                <button 
                  className={`btn btn-small ${aiActiveSubTab === 'debugger' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setAiActiveSubTab('debugger')}
                >
                  AI Log Debugger
                </button>
                <button 
                  className={`btn btn-small ${aiActiveSubTab === 'rewrite' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setAiActiveSubTab('rewrite')}
                >
                  Config Rewrite Helper
                </button>
                <button 
                  className={`btn btn-small ${aiActiveSubTab === 'composer' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setAiActiveSubTab('composer')}
                >
                  AI Cron Composer
                </button>
              </div>

              {/* AI LOG DEBUGGER */}
              {aiActiveSubTab === 'debugger' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                  {/* Left Column - Log Input */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Paste Server / App Error Logs</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Paste stdout/stderr stack traces from your runtime processes or database connections.
                    </p>
                    
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <textarea
                        className="form-input"
                        placeholder="Paste error logs here... (e.g. Error: listen EADDRINUSE: address already in use :::3000)"
                        value={aiLogInput}
                        onChange={e => setAiLogInput(e.target.value)}
                        rows={8}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Presets:</span>
                      {[
                        { label: 'Port conflict', log: 'Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1485:16)' },
                        { label: 'Permission denied', log: 'fs.js:125\n    throw new Error(\'EACCES: permission denied, open /var/www/sandbox/index.html\')' },
                        { label: 'Out of memory', log: 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory' },
                        { label: 'DB Password Error', log: 'FATAL: password authentication failed for user "postgres"\nconnection to server at "127.0.0.1", port 5432 failed' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          className="btn btn-secondary btn-small"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => setAiLogInput(preset.log)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={handleAnalyzeLog}
                      disabled={aiLogLoading}
                    >
                      {aiLogLoading ? 'Analyzing Logs...' : 'Run AI Debugger'}
                    </button>
                  </div>

                  {/* Right Column - Diagnosis */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: aiLogDiagnosis ? 'flex-start' : 'center', alignItems: aiLogDiagnosis ? 'stretch' : 'center', minHeight: '350px' }}>
                    {aiLogDiagnosis ? (
                      <div className="fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-blue)' }}>
                          <Sparkles size={20} />
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>AI Diagnostic Analysis</h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '4px' }}>Diagnosis</div>
                            <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{aiLogDiagnosis}</strong>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Probable Root Cause</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>{aiLogRootCause}</p>
                          </div>

                          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Recommended Resolution</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>{aiLogSolution}</p>
                          </div>

                          {aiLogFix && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }} className="fade-in">
                              <div style={{ flex: 1, marginRight: '16px' }}>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>Automated Healing Available</div>
                                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{aiLogFix.label}</span>
                              </div>
                              <button 
                                className="btn btn-primary"
                                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                                onClick={handleApplyAiFix}
                                disabled={aiLogFixing}
                              >
                                {aiLogFixing ? 'Applying...' : 'Apply Fix'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Sparkles size={40} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--accent-blue)' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>AI Diagnostics Idle</div>
                        <div style={{ fontSize: '0.8rem' }}>Paste a log on the left and click run to compile diagnostics.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONFIG REWRITE HELPER */}
              {aiActiveSubTab === 'rewrite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label className="form-label">English Configuration Description</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Redirect /old-blog to /new-blog permanent and force SSL"
                          value={aiRewritePrompt}
                          onChange={e => setAiRewritePrompt(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group" style={{ width: '180px', margin: 0 }}>
                        <label className="form-label">Target Engine</label>
                        <select
                          className="value-input form-input"
                          value={aiRewriteEngine}
                          onChange={e => setAiRewriteEngine(e.target.value as any)}
                        >
                          <option value="nginx">Nginx Config</option>
                          <option value="apache">Apache (.htaccess)</option>
                          <option value="caddy">Caddy (Caddyfile)</option>
                        </select>
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ height: '40px' }}
                        onClick={handleGenerateConfig}
                        disabled={aiRewriteLoading}
                      >
                        {aiRewriteLoading ? 'Generating...' : 'Generate Configuration'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Examples:</span>
                      {[
                        'Redirect /blog to https://medium.com',
                        'Enforce HTTPS and SSL redirection on all ports',
                        'Reverse proxy requests on /api to localhost:8000'
                      ].map((ex, idx) => (
                        <button
                          key={idx}
                          className="btn btn-secondary btn-small"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => setAiRewritePrompt(ex)}
                        >
                          "{ex}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {aiRewriteResult && (
                    <div className="card fade-in" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--accent-blue)' }}>
                          Generated Syntax for {aiRewriteEngine.toUpperCase()}
                        </h4>
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            navigator.clipboard.writeText(aiRewriteResult);
                            addToast('Copied to clipboard!', 'success');
                          }}
                        >
                          Copy Code
                        </button>
                      </div>

                      <pre style={{ 
                        margin: 0, 
                        padding: '16px', 
                        background: '#0a0a0c', 
                        color: '#a9b1d6', 
                        fontFamily: 'monospace', 
                        fontSize: '0.82rem', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {aiRewriteResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* AI CRON COMPOSER */}
              {aiActiveSubTab === 'composer' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                  {/* Left Column - Input */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Describe Execution Frequency</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      State when you want the task to run in plain English.
                    </p>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. every Sunday at midnight"
                        value={aiCronPrompt}
                        onChange={e => setAiCronPrompt(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Examples:</span>
                      {[
                        'every minute',
                        'every hour at midnight',
                        'every Sunday',
                        'every 15 minutes',
                        'midnight on weekdays'
                      ].map((ex, idx) => (
                        <button
                          key={idx}
                          className="btn btn-secondary btn-small"
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => setAiCronPrompt(ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleComposeCron}
                      disabled={aiCronLoading}
                    >
                      {aiCronLoading ? 'Composing...' : 'Compose Cron Expression'}
                    </button>
                  </div>

                  {/* Right Column - Results */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: aiCronResult ? 'flex-start' : 'center', alignItems: aiCronResult ? 'stretch' : 'center', minHeight: '300px' }}>
                    {aiCronResult ? (
                      <div className="fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-blue)' }}>
                          <Sparkles size={20} />
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Composed Cron Schedule</h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ background: '#0a0a0c', border: '1px solid var(--border-color)', padding: '12px 24px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'inline-block' }}>
                              {aiCronResult}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Cron Expression</div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Standard 5-field format</span>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Schedule Explanation</div>
                            <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500, margin: 0 }}>
                              {aiCronExplanation}
                            </p>
                          </div>

                          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <div style={{ flex: 1, marginRight: '16px' }}>
                              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Deploy to Scheduler</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Add this job to Keel Panel cron task queue</span>
                            </div>
                            <button
                              className="btn btn-primary"
                              onClick={handleApplyCronFromAi}
                            >
                              Create Cron Job
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Clock size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Cron Composer Idle</div>
                        <div style={{ fontSize: '0.8rem' }}>Describe a schedule on the left to compose its cron syntax.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 10: CLOUD-NATIVE INTEGRATIONS */}
          {activeTab === 'cloud' && (
            <div className="fade-in">
              {/* Sub-tab navigation */}
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '24px', maxWidth: '400px' }}>
                <button 
                  className={`btn btn-small ${cloudActiveSubTab === 'backups' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setCloudActiveSubTab('backups')}
                >
                  Cloud Backups
                </button>
                <button 
                  className={`btn btn-small ${cloudActiveSubTab === 'dns' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setCloudActiveSubTab('dns')}
                >
                  DNS Provider APIs
                </button>
              </div>

              {/* CLOUD BACKUPS */}
              {cloudActiveSubTab === 'backups' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                  {/* Left Column: Cloud Backup Settings */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Configure Cloud Buckets</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Connect Keel Panel sandbox files to remote secure Object Storage API targets.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      {[
                        { id: 's3', name: 'Amazon S3' },
                        { id: 'gcs', name: 'Google Cloud (GCS)' },
                        { id: 'b2', name: 'Backblaze B2' }
                      ].map((provider) => (
                        <button
                          key={provider.id}
                          className={`btn btn-small ${cloudBackupProvider === provider.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => setCloudBackupProvider(provider.id as any)}
                        >
                          {provider.name}
                        </button>
                      ))}
                    </div>

                    {cloudBackupProvider === 's3' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">AWS Access Key ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.s3?.accessKeyId || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              s3: { ...backupCreds.s3, accessKeyId: e.target.value }
                            })}
                            placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">AWS Secret Access Key</label>
                          <input
                            type="password"
                            className="form-input"
                            value={backupCreds.s3?.secretAccessKey || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              s3: { ...backupCreds.s3, secretAccessKey: e.target.value }
                            })}
                            placeholder="••••••••••••••••••••••••••••••••"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">S3 Target Bucket Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.s3?.bucket || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              s3: { ...backupCreds.s3, bucket: e.target.value }
                            })}
                            placeholder="e.g. keel-backups-s3"
                          />
                        </div>
                      </div>
                    )}

                    {cloudBackupProvider === 'gcs' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Google Cloud Project ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.gcs?.projectId || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              gcs: { ...backupCreds.gcs, projectId: e.target.value }
                            })}
                            placeholder="e.g. my-gcp-project-123"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">GCS Target Bucket Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.gcs?.bucket || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              gcs: { ...backupCreds.gcs, bucket: e.target.value }
                            })}
                            placeholder="e.g. keel-backups-gcs"
                          />
                        </div>
                      </div>
                    )}

                    {cloudBackupProvider === 'b2' && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Backblaze Key ID</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.b2?.keyId || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              b2: { ...backupCreds.b2, keyId: e.target.value }
                            })}
                            placeholder="e.g. 0032b8a74e50201..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Backblaze Application Key</label>
                          <input
                            type="password"
                            className="form-input"
                            value={backupCreds.b2?.applicationKey || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              b2: { ...backupCreds.b2, applicationKey: e.target.value }
                            })}
                            placeholder="••••••••••••••••••••••••••••••••"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">B2 Target Bucket Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={backupCreds.b2?.bucket || ''}
                            onChange={e => setBackupCreds({
                              ...backupCreds,
                              b2: { ...backupCreds.b2, bucket: e.target.value }
                            })}
                            placeholder="e.g. keel-backups-b2"
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => handleSaveBackupCredentials(cloudBackupProvider, backupCreds[cloudBackupProvider])}
                      >
                        Save Configuration
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => handleTriggerBackup(cloudBackupProvider)}
                        disabled={cloudBackupTriggering}
                      >
                        {cloudBackupTriggering ? 'Uploading...' : 'Trigger Backup'}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Backup History */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Backup Logs History</h4>
                    
                    {cloudBackupsLoading ? (
                      <div>Synchronizing backup catalog...</div>
                    ) : (
                      <div className="db-table-container">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Target</th>
                              <th>Size</th>
                              <th>Status</th>
                              <th>Storage Path</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cloudBackupsList.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No backups records found.</td>
                              </tr>
                            ) : (
                              cloudBackupsList.map((log) => (
                                <tr key={log.id}>
                                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}</td>
                                  <td><span className="db-user-badge" style={{ textTransform: 'uppercase' }}>{log.provider}</span></td>
                                  <td style={{ fontWeight: 600 }}>{log.size}</td>
                                  <td>
                                    <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '4px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: 600,
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: 'var(--success)'
                                    }}>
                                      {log.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-secondary)' }} title={log.path}>
                                    {log.path.length > 30 ? `${log.path.substring(0, 30)}...` : log.path}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DNS PROVIDER APIS */}
              {cloudActiveSubTab === 'dns' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                  {/* Left Column: DNS Provider Settings */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Configure External APIs</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Link external API access to automatically synchronize your DNS zone mappings.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Cloudflare */}
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Cloudflare DNS Integration</strong>
                          {dnsProviders.cloudflare?.active && (
                            <span className="db-user-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>ACTIVE</span>
                          )}
                        </div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Cloudflare API Account Email"
                            value={dnsProviders.cloudflare?.email || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              cloudflare: { ...dnsProviders.cloudflare, email: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="Cloudflare API Bearer Token"
                            value={dnsProviders.cloudflare?.token || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              cloudflare: { ...dnsProviders.cloudflare, token: e.target.value }
                            })}
                          />
                        </div>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => handleSaveDnsCredentials('cloudflare', dnsProviders.cloudflare)}
                        >
                          Link & Activate Cloudflare
                        </button>
                      </div>

                      {/* AWS Route53 */}
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>AWS Route53 DNS Integration</strong>
                          {dnsProviders.route53?.active && (
                            <span className="db-user-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>ACTIVE</span>
                          )}
                        </div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="AWS Access Key ID"
                            value={dnsProviders.route53?.accessKeyId || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              route53: { ...dnsProviders.route53, accessKeyId: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="AWS Secret Access Key"
                            value={dnsProviders.route53?.secretAccessKey || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              route53: { ...dnsProviders.route53, secretAccessKey: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Hosted Zone ID (e.g. Z2FDTND...)"
                            value={dnsProviders.route53?.zoneId || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              route53: { ...dnsProviders.route53, zoneId: e.target.value }
                            })}
                          />
                        </div>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => handleSaveDnsCredentials('route53', dnsProviders.route53)}
                        >
                          Link & Activate Route53
                        </button>
                      </div>

                      {/* DigitalOcean */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>DigitalOcean DNS Integration</strong>
                          {dnsProviders.digitalocean?.active && (
                            <span className="db-user-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>ACTIVE</span>
                          )}
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="DigitalOcean Personal Access Token"
                            value={dnsProviders.digitalocean?.token || ''}
                            onChange={e => setDnsProviders({
                              ...dnsProviders,
                              digitalocean: { ...dnsProviders.digitalocean, token: e.target.value }
                            })}
                          />
                        </div>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => handleSaveDnsCredentials('digitalocean', dnsProviders.digitalocean)}
                        >
                          Link & Activate DigitalOcean
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Zone Sync Dashboard */}
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Domain Record Sync Console</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Force refresh and update zone parameters on your active external DNS registrar.
                    </p>

                    {dnsLoading ? (
                      <div>Synchronizing connection state...</div>
                    ) : (
                      <div className="db-table-container">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Domain Name</th>
                              <th>Current Backend Engine</th>
                              <th>Local Zone Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domains.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No active domains found.</td>
                              </tr>
                            ) : (
                              domains.map((dom, idx) => {
                                const activeDns = Object.keys(dnsProviders).find(key => dnsProviders[key]?.active) || 'none';
                                return (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{dom.name}</td>
                                    <td><span className="db-user-badge">{dom.engine.toUpperCase()}</span></td>
                                    <td>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--success)'
                                      }}>
                                        Synced Bind9
                                      </span>
                                    </td>
                                    <td>
                                      {activeDns === 'none' ? (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No Active DNS API</span>
                                      ) : (
                                        <button
                                          className="btn btn-primary btn-small"
                                          onClick={() => handleSyncDnsProvider(dom.name, activeDns)}
                                          disabled={dnsSyncing === dom.name}
                                        >
                                          {dnsSyncing === dom.name ? 'Syncing...' : `Sync to ${activeDns.toUpperCase()}`}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
          
          {/* TAB 12: TENANT MANAGER */}
          {activeTab === 'tenants' && (
            <div className="fade-in">
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Tenant Accounts Manager</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Create and manage multitenant VPS host users and allocate storage quotas.
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsNewTenantModalOpen(true)}
                  >
                    Add Tenant
                  </button>
                </div>

                {isTenantLoading ? (
                  <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>Loading tenants...</div>
                ) : (
                  <div className="db-table-container">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Role</th>
                          <th>Disk Quota</th>
                          <th>RAM Limit</th>
                          <th>CPU Limit</th>
                          <th>Created Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                              No tenant accounts registered yet.
                            </td>
                          </tr>
                        ) : (
                          tenantsList.map((ten, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{ten.username}</td>
                              <td><span className="db-user-badge">{ten.role.toUpperCase()}</span></td>
                              <td style={{ fontWeight: 600 }}>{ten.quota}</td>
                              <td style={{ fontWeight: 600 }}>{ten.ramLimit || '1 GB'}</td>
                              <td style={{ fontWeight: 600 }}>{ten.cpuLimit || '1.0'} Cores</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{ten.created}</td>
                              <td>
                                <button
                                  className="btn btn-danger btn-small"
                                  onClick={() => handleDeleteTenant(ten.username)}
                                >
                                  Suspend Account
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: TEAM & IAM */}
          {activeTab === 'team' && (
            <div className="fade-in">
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Team Collaborators (IAM)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Delegate access rights to your developers and database administrators with custom credentials.
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsNewCollabModalOpen(true)}
                  >
                    Invite Collaborator
                  </button>
                </div>

                {isCollaboratorLoading ? (
                  <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>Loading team members...</div>
                ) : (
                  <div className="db-table-container">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Role Scope</th>
                          <th>Created Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collaborators.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                              No collaborators invited yet. Create your first team member!
                            </td>
                          </tr>
                        ) : (
                          collaborators.map((collab, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{collab.username}</td>
                              <td>
                                <span className={`db-user-badge`}
                                      style={{
                                        textTransform: 'uppercase',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: collab.role === 'developer' ? 'rgba(59, 130, 246, 0.1)' : collab.role === 'dba' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: collab.role === 'developer' ? '#3b82f6' : collab.role === 'dba' ? '#f59e0b' : '#10b981'
                                      }}>
                                  {collab.role}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-secondary)' }}>{collab.created}</td>
                              <td>
                                <button
                                  className="btn btn-danger btn-small"
                                  onClick={() => handleDeleteCollaborator(collab.username)}
                                >
                                  Revoke Access
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE TENANT ACCOUNT */}
      {isNewTenantModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Tenant Account</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewTenantModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Tenant Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. tenant2"
                  value={newTenantUsername}
                  onChange={e => setNewTenantUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Password"
                  value={newTenantPassword}
                  onChange={e => setNewTenantPassword(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Storage Disk Quota</label>
                <select
                  className="form-select"
                  value={newTenantQuota}
                  onChange={e => setNewTenantQuota(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}
                >
                  <option value="1 GB">1 GB limit</option>
                  <option value="5 GB">5 GB limit</option>
                  <option value="10 GB">10 GB limit</option>
                  <option value="20 GB">20 GB limit</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">RAM (Memory) Limit</label>
                <select
                  className="form-select"
                  value={newTenantRamLimit}
                  onChange={e => setNewTenantRamLimit(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}
                >
                  <option value="512 MB">512 MB limit</option>
                  <option value="1 GB">1 GB limit</option>
                  <option value="2 GB">2 GB limit</option>
                  <option value="4 GB">4 GB limit</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">CPU Cores Limit</label>
                <select
                  className="form-select"
                  value={newTenantCpuLimit}
                  onChange={e => setNewTenantCpuLimit(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}
                >
                  <option value="0.5">0.5 Cores</option>
                  <option value="1.0">1.0 Core</option>
                  <option value="2.0">2.0 Cores</option>
                  <option value="4.0">4.0 Cores</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewTenantModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateTenant}>Create Tenant</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEAM COLLABORATOR */}
      {isNewCollabModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invite Team Collaborator</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewCollabModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Collaborator Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. alice_dev"
                  value={newCollabUsername}
                  onChange={e => setNewCollabUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Choose a strong password"
                  value={newCollabPassword}
                  onChange={e => setNewCollabPassword(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">IAM Role / Scope</label>
                <select
                  className="form-select"
                  value={newCollabRole}
                  onChange={e => setNewCollabRole(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}
                >
                  <option value="developer">Developer (Files & Git Deployments)</option>
                  <option value="dba">DBA (Database Manager & Queries)</option>
                  <option value="admin">Admin (Full Access to Tenant Profile)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewCollabModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateCollaborator}>Create Collaborator</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM POPUPS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} color="#10b981" />}
            {t.type === 'error' && <XCircle size={18} color="#ef4444" />}
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {/* MODAL 1: FILE EDITOR */}
      {isEditorOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-editor">
            <div className="modal-header">
              <h3 className="modal-title">Editing: {selectedFile?.name}</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsEditorOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <textarea 
                className="editor-textarea" 
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsEditorOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveFileContent}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW FILE / DIRECTORY */}
      {isNewFileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Item</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewFileModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Type</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="filetype" 
                      checked={newFileType === 'file'} 
                      onChange={() => setNewFileType('file')} 
                    />
                    <span>Text File</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="filetype" 
                      checked={newFileType === 'directory'} 
                      onChange={() => setNewFileType('directory')} 
                    />
                    <span>Directory</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. index.js or config_folder"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewFileModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFileOrFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE DATABASE */}
      {isNewDbModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Database</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewDbModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Database Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. forum_db"
                  value={newDbName}
                  onChange={e => setNewDbName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Database Engine</label>
                <select
                  className="form-input"
                  value={wizardDbType}
                  onChange={e => setWizardDbType(e.target.value)}
                >
                  <option value="mysql">MariaDB / MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewDbModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                fetch('/api/databases/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newDbName, type: wizardDbType })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    addToast('Database created!', 'success');
                    setIsNewDbModalOpen(false);
                    setNewDbName('');
                    fetchDatabases();
                  } else {
                    addToast(data.error || 'Failed to create database', 'error');
                  }
                })
                .catch(() => addToast('Error creating database', 'error'));
              }}>Create Database</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DATABASE WIZARD */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Database Wizard (Step {wizardStep} of 3)</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsWizardOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {wizardStep === 1 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Step 1: Create Database</h4>
                  <div className="form-group">
                    <label className="form-label">Database Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. wp_site"
                      value={wizardDbName}
                      onChange={e => setWizardDbName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Database Engine</label>
                    <select 
                      className="form-input"
                      value={wizardDbType}
                      onChange={e => setWizardDbType(e.target.value)}
                    >
                      <option value="mysql">MariaDB / MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Step 2: Create Database User</h4>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. wp_admin"
                      value={wizardUsername}
                      onChange={e => setWizardUsername(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={wizardPassword}
                      onChange={e => setWizardPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Step 3: Map User Privileges</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Grant all access privileges to user <strong>{wizardUsername}</strong> on database <strong>{wizardDbName}</strong>.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsWizardOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleWizardNextStep}>
                {wizardStep === 3 ? 'Finish & Map Privileges' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMINER MANAGER */}
      {isAdminerOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Adminer Database Manager</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsAdminerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Target Domain</label>
                <select 
                  className="form-input"
                  value={adminerDomain}
                  onChange={e => {
                    setAdminerDomain(e.target.value);
                    setIsAdminerInstalled(false);
                  }}
                >
                  <option value="">-- Choose Domain --</option>
                  {domains.map((d: any, idx: number) => (
                    <option key={idx} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {adminerDomain && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.88rem' }}>Adminer Status:</span>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={handleInstallAdminer}
                      disabled={isInstallingAdminer}
                    >
                      {isInstallingAdminer ? 'Installing...' : 'Install Adminer.php'}
                    </button>
                  </div>

                  {isAdminerInstalled && (
                    <div style={{ padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '20px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>One-Click SSO Login</h4>
                      <div className="form-group">
                        <label className="form-label">Select Database</label>
                        <select 
                          className="form-input"
                          value={adminerDb}
                          onChange={e => setAdminerDb(e.target.value)}
                        >
                          <option value="">-- Choose DB --</option>
                          {databases.map((db, idx) => (
                            <option key={idx} value={db.name}>{db.name} ({db.type})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Database Username</label>
                        <select 
                          className="form-input"
                          value={adminerUser}
                          onChange={e => setAdminerUser(e.target.value)}
                        >
                          <option value="">-- Choose User --</option>
                          {dbUsers.map((u, idx) => (
                            <option key={idx} value={u.username}>{u.username}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          value={adminerPass}
                          onChange={e => setAdminerPass(e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '10px' }}
                        onClick={handleAdminerSSO}
                      >
                        Launch Adminer SSO
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsAdminerOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE DB USER */}
      {isNewDbUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create SQL Access User</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewDbUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. dev_user"
                  value={newDbUsername}
                  onChange={e => setNewDbUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewDbUserModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateDbUser}>Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ASSOCIATE USER TO DB */}
      {isAssociateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Grant User Privileges</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsAssociateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select User</label>
                <select 
                  className="form-input"
                  value={associateUser}
                  onChange={e => setAssociateUser(e.target.value)}
                >
                  <option value="">-- Choose User --</option>
                  {dbUsers.map((user, idx) => (
                    <option key={idx} value={user.username}>{user.username}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsAssociateModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssociateUser}>Grant Access</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE DOMAIN */}
      {isNewDomainModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Domain / Subdomain</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewDomainModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Domain Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. blog.mydomain.com"
                  value={newDomainName}
                  onChange={e => setNewDomainName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Document Root Path (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Defaults to /sandbox/<user>"
                  value={newDomainDocroot}
                  onChange={e => setNewDomainDocroot(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Server Engine</label>
                  <select 
                    className="form-input"
                    value={newDomainEngine}
                    onChange={e => setNewDomainEngine(e.target.value as 'nginx' | 'apache')}
                  >
                    <option value="nginx">Nginx Proxy</option>
                    <option value="apache">Apache HTTPD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PHP Version</label>
                  <select 
                    className="form-input"
                    value={newDomainPhpVersion}
                    onChange={e => setNewDomainPhpVersion(e.target.value)}
                  >
                    <option value="8.1">PHP 8.1</option>
                    <option value="8.2">PHP 8.2</option>
                    <option value="8.3">PHP 8.3</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Permanent Redirect (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. https://www.google.com"
                  value={newDomainRedirect}
                  onChange={e => setNewDomainRedirect(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewDomainModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateDomain}>Create Domain</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD DNS RECORD */}
      {isDnsRecordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add DNS Zone Record</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsDnsRecordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Record Type</label>
                  <select 
                    className="form-input"
                    value={newDnsType}
                    onChange={e => setNewDnsType(e.target.value)}
                  >
                    <option value="A">A (Address)</option>
                    <option value="AAAA">AAAA (IPv6 Address)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                    <option value="MX">MX (Mail Exchanger)</option>
                    <option value="TXT">TXT (Text)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Record Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. www, mail, or @"
                    value={newDnsName}
                    onChange={e => setNewDnsName(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Value</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 192.168.1.100 or alias.domain.com"
                  value={newDnsValue}
                  onChange={e => setNewDnsValue(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">TTL (Seconds)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 3600"
                  value={newDnsTtl}
                  onChange={e => setNewDnsTtl(parseInt(e.target.value, 10) || 3600)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDnsRecordModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDnsRecord}>Add Record</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: CONFIGURE REDIRECT */}
      {isRedirectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Configure Redirection for {redirectDomainName}</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsRedirectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Redirect Destination URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. https://www.google.com (Leave blank to remove)"
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsRedirectModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRedirect}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHMOD PERMISSIONS */}
      {isChmodModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Change File Permissions</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsChmodModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Path: <code style={{ color: 'var(--accent-blue)' }}>{chmodPath}</code>
              </p>
              <div className="form-group">
                <label className="form-label">Octal Mode</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="755"
                  value={chmodMode}
                  onChange={e => setChmodMode(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsChmodModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleChmod}>Change Permissions</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPRESS FILE/FOLDER */}
      {isCompressModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Compress Folder/File</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsCompressModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Archive Filename</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. archive.zip"
                  value={compressArchiveName}
                  onChange={e => setCompressArchiveName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Format Type</label>
                <select 
                  className="form-input"
                  value={compressFormat}
                  onChange={e => setCompressFormat(e.target.value)}
                >
                  <option value="zip">ZIP format (.zip)</option>
                  <option value="tar">TAR GZ format (.tar.gz)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsCompressModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCompress}>Compress</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECOMPRESS ARCHIVE */}
      {isDecompressModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Decompress Archive</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsDecompressModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Extracting: <code style={{ color: 'var(--accent-blue)' }}>{decompressPath}</code>
              </p>
              <div className="form-group">
                <label className="form-label">Destination Directory (Relative to Sandbox)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. assets (leave blank for current folder)"
                  value={decompressDestPath}
                  onChange={e => setDecompressDestPath(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDecompressModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDecompress}>Extract All</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOCK IP ADDRESS */}
      {isNewIpBlockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Restrict IP / Network Subnet</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewIpBlockModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">IP Address or CIDR Range</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                  value={newBlockedIp}
                  onChange={e => setNewBlockedIp(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Restriction Reason</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Rate limiting violation"
                  value={newBlockReason}
                  onChange={e => setNewBlockReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewIpBlockModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddIpBlock}>Restrict Access</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIREWALL RULE */}
      {isNewFirewallRuleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Create Firewall Port Exception</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewFirewallRuleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Port Exception or Service Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 8080 or http"
                  value={newRulePort}
                  onChange={e => setNewRulePort(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Protocol Scope</label>
                  <select 
                    className="form-input"
                    value={newRuleProtocol}
                    onChange={e => setNewRuleProtocol(e.target.value)}
                  >
                    <option value="tcp">TCP Protocol</option>
                    <option value="udp">UDP Protocol</option>
                    <option value="">Any / Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rule Directive</label>
                  <select 
                    className="form-input"
                    value={newRuleAction}
                    onChange={e => setNewRuleAction(e.target.value)}
                  >
                    <option value="ALLOW">ALLOW ACCESS</option>
                    <option value="DENY">DENY ACCESS</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Custom Node application listener"
                  value={newRuleComment}
                  onChange={e => setNewRuleComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewFirewallRuleModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddFirewallRule}>Add Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EMAIL ACCOUNT */}
      {isNewEmailModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Create Email Mailbox</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewEmailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">Email Username (Prefix)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. contact"
                    value={newEmailLocal}
                    onChange={e => setNewEmailLocal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Domain Selector</label>
                  <select 
                    className="form-input"
                    value={newEmailDomain}
                    onChange={e => setNewEmailDomain(e.target.value)}
                  >
                    {domains.map((dom, idx) => (
                      <option key={idx} value={dom.name}>@{dom.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mailbox Access Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••"
                  value={newEmailPassword}
                  onChange={e => setNewEmailPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Storage Quota Limit</label>
                <select 
                  className="form-input"
                  value={newEmailQuota}
                  onChange={e => setNewEmailQuota(e.target.value)}
                >
                  <option value="100 MB">100 MB (Light)</option>
                  <option value="250 MB">250 MB (Medium)</option>
                  <option value="500 MB">500 MB (Standard)</option>
                  <option value="1 GB">1 GB (Large)</option>
                  <option value="Unlimited">Unlimited (Unrestricted)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewEmailModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateEmail}>Create Mailbox</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FORWARDER */}
      {isNewForwarderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Create Email Forwarding Rule</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewForwarderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Source Email Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. contact@keel-wp.test"
                  value={newForwarderSource}
                  onChange={e => setNewForwarderSource(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Forward Target Destination</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. personal@gmail.com"
                  value={newForwarderDest}
                  onChange={e => setNewForwarderDest(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewForwarderModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateForwarder}>Create Forwarder</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE AUTORESPONDER */}
      {isNewAutoresponderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Configure Out of Office Autoresponder</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewAutoresponderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Configure for Mailbox Address</label>
                <select 
                  className="form-input"
                  value={newAutoresponderEmail}
                  onChange={e => setNewAutoresponderEmail(e.target.value)}
                >
                  {emailsList.map((m, idx) => (
                    <option key={idx} value={m.email}>{m.email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Autoresponder Subject Line</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Out of Office / Vacation Auto-Reply"
                  value={newAutoresponderSubject}
                  onChange={e => setNewAutoresponderSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Auto-Reply Email Body Message</label>
                <textarea 
                  className="form-input" 
                  placeholder="Hello, I will be out of the office from..."
                  value={newAutoresponderMessage}
                  onChange={e => setNewAutoresponderMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewAutoresponderModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateAutoresponder}>Save Responder</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WEBMAIL COMPOSER */}
      {isWebmailComposeOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Webmail Composer Simulator</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsWebmailComposeOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Sender (From)</label>
                <select 
                  className="form-input"
                  value={webmailComposeFrom}
                  onChange={e => setWebmailComposeFrom(e.target.value)}
                >
                  {emailsList.length === 0 ? (
                    <option value="admin@keel-wp.test">admin@keel-wp.test</option>
                  ) : (
                    emailsList.map((m, idx) => (
                      <option key={idx} value={m.email}>{m.email}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Recipient (To)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. recipient@external.com"
                  value={webmailComposeTo}
                  onChange={e => setWebmailComposeTo(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Project Update details"
                  value={webmailComposeSubject}
                  onChange={e => setWebmailComposeSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message Body</label>
                <textarea 
                  className="form-input" 
                  placeholder="Write your email here..."
                  value={webmailComposeBody}
                  onChange={e => setWebmailComposeBody(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsWebmailComposeOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendWebmailMessage}>Send Email</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SSH KEY */}
      {isNewSshKeyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Authorize SSH Public Key</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewSshKeyModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Key Name / Identifier</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. craig-laptop"
                  value={newSshKeyName}
                  onChange={e => setNewSshKeyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Public Key Data (starts with ssh-rsa, ssh-ed25519, etc.)</label>
                <textarea 
                  className="form-input" 
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ..."
                  value={newSshKeyContent}
                  onChange={e => setNewSshKeyContent(e.target.value)}
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewSshKeyModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateSshKey}>Authorize Key</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD PROGRESS MONITOR */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title font-semibold">File Upload Manager</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsUploadModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uploadingFiles.map((up, idx) => (
                  <div key={idx} style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{up.name}</span>
                      <span style={{ 
                        color: up.status === 'success' ? 'var(--success)' : (up.status === 'error' || up.status === 'folder_error') ? 'var(--danger)' : 'var(--accent-blue)',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        {up.status === 'folder_error' ? 'FOLDER (USE ZIP)' : up.status.toUpperCase()}
                      </span>
                    </div>
                    {up.status === 'uploading' && (
                      <div className="progress-bar-container" style={{ margin: 0, height: '4px' }}>
                        <div className="progress-bar-fill" style={{ width: '50%' }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ADD CRON JOB */}
      {isNewCronModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Schedule New Cron Task</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewCronModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task Command</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. php public/index.php cleanup"
                  value={newCronCommand}
                  onChange={e => setNewCronCommand(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Hourly database pruning"
                  value={newCronDesc}
                  onChange={e => setNewCronDesc(e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0', padding: '16px 0 0 0' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Advanced Schedule Wizard</h4>
                
                <div className="form-group">
                  <label className="form-label">Common Setting Presets</label>
                  <select 
                    className="form-input"
                    value={cronPreset}
                    onChange={e => setCronPreset(e.target.value)}
                  >
                    <option value="custom">-- Custom Cron Expression --</option>
                    <option value="* * * * *">Once a minute (* * * * *)</option>
                    <option value="0 * * * *">Once an hour (0 * * * *)</option>
                    <option value="0 0 * * *">Once a day (0 0 * * *)</option>
                    <option value="0 0 * * 0">Once a week (0 0 * * 0)</option>
                    <option value="0 0 1 * *">Once a month (0 0 1 * *)</option>
                    <option value="0 0 1 1 *">Once a year (0 0 1 1 *)</option>
                  </select>
                </div>

                {cronPreset === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Minute</label>
                      <select className="form-input" value={wizardMin} onChange={e => setWizardMin(e.target.value)}>
                        <option value="*">Every (*)</option>
                        <option value="0">00 (Top of hour)</option>
                        <option value="*/5">Every 5 (*/5)</option>
                        <option value="*/15">Every 15 (*/15)</option>
                        <option value="*/30">Every 30 (*/30)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Hour</label>
                      <select className="form-input" value={wizardHour} onChange={e => setWizardHour(e.target.value)}>
                        <option value="*">Every (*)</option>
                        <option value="0">Midnight (0)</option>
                        <option value="12">Noon (12)</option>
                        <option value="*/2">Every 2h (*/2)</option>
                        <option value="*/6">Every 6h (*/6)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Day</label>
                      <select className="form-input" value={wizardDay} onChange={e => setWizardDay(e.target.value)}>
                        <option value="*">Every (*)</option>
                        <option value="1">1st (1)</option>
                        <option value="15">15th (15)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Month</label>
                      <select className="form-input" value={wizardMonth} onChange={e => setWizardMonth(e.target.value)}>
                        <option value="*">Every (*)</option>
                        <option value="1">January (1)</option>
                        <option value="6">June (6)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Weekday</label>
                      <select className="form-input" value={wizardWeekday} onChange={e => setWizardWeekday(e.target.value)}>
                        <option value="*">Every (*)</option>
                        <option value="0">Sunday (0)</option>
                        <option value="1">Monday (1)</option>
                        <option value="5">Friday (5)</option>
                        <option value="6">Saturday (6)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Constructed Cron Expression</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newCronSchedule}
                    onChange={e => {
                      setCronPreset('custom');
                      setNewCronSchedule(e.target.value);
                    }}
                    style={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewCronModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateCron}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CRON LOGS */}
      {isLogsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Cron Execution Logs</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsLogsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              {cronLogsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No task execution history available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cronLogsList.map((log, idx) => (
                    <div key={log.id || idx} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--accent-blue)', marginRight: '8px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>({new Date(log.timestamp).toLocaleDateString()})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                          <span>Elapsed: <strong>{log.executionTimeMs}ms</strong></span>
                          <span>Exit Code: <strong style={{ color: log.exitCode === 0 ? 'var(--success)' : 'var(--danger)' }}>{log.exitCode}</strong></span>
                        </div>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <code style={{ fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>{log.command}</code>
                        {log.description && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>— {log.description}</span>}
                      </div>
                      
                      {(log.stdout || log.stderr) && (
                        <pre style={{ 
                          margin: '8px 0 0 0',
                          padding: '8px', 
                          background: '#000000', 
                          color: '#00ff00', 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem', 
                          borderRadius: '4px',
                          overflowX: 'auto',
                          maxHeight: '120px',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {log.stdout && log.stdout}
                          {log.stderr && <span style={{ color: '#ff3333' }}>{log.stderr}</span>}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsLogsModalOpen(false)}>Close Logs</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TASK EXECUTION RESULTS */}
      {executionResultModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">On-Demand Execution Complete</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setExecutionResultModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Execution Time: </span>
                  <strong>{executionResultModal.executionTimeMs} ms</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Exit Status Code: </span>
                  <strong style={{ color: executionResultModal.exitCode === 0 ? 'var(--success)' : 'var(--danger)' }}>{executionResultModal.exitCode}</strong>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Executed Command</label>
                <code style={{ display: 'block', padding: '6px', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.8rem' }}>{executionResultModal.command}</code>
              </div>
              
              <div className="form-group">
                <label className="form-label">Standard Output (stdout) / Standard Error (stderr)</label>
                <pre style={{ 
                  margin: 0,
                  padding: '12px', 
                  background: '#000000', 
                  color: '#ffffff', 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem', 
                  borderRadius: '4px',
                  overflowY: 'auto',
                  maxHeight: '250px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {executionResultModal.stdout ? executionResultModal.stdout : <span style={{ color: 'var(--text-secondary)' }}>[No standard output]</span>}
                  {executionResultModal.stderr && <span style={{ color: '#ff3333', display: 'block', marginTop: '6px' }}>{executionResultModal.stderr}</span>}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setExecutionResultModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: LINK GIT REPO (NEW PROJECT) */}
      {isNewProjectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Link Git Repository</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewProjectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Git HTTPS Repository URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://github.com/username/project-repo"
                  value={newProjectRepo}
                  onChange={e => setNewProjectRepo(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Branch</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="main"
                  value={newProjectBranch}
                  onChange={e => setNewProjectBranch(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Runtime Environment</label>
                <select 
                  className="form-input"
                  value={newProjectRuntime}
                  onChange={e => setNewProjectRuntime(e.target.value)}
                >
                  <option value="static">Static Web App</option>
                  <option value="nodejs">Node.js (PM2 runtime)</option>
                  <option value="python">Python (WSGI runtime)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Build Command (optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="npm run build"
                  value={newProjectBuildCmd}
                  onChange={e => setNewProjectBuildCmd(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Publish / Output Directory (optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="dist"
                  value={newProjectPublishDir}
                  onChange={e => setNewProjectPublishDir(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewProjectModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateProject}>Link & Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW BUILD LOGS */}
      {viewingBuildLogsProj && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Build & Deploy Logs: {viewingBuildLogsProj.name}</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setViewingBuildLogsProj(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ 
                margin: 0,
                padding: '16px', 
                background: '#0a0a0c', 
                color: '#eceff4', 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                borderRadius: '6px',
                overflowY: 'auto',
                maxHeight: '400px',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-color)'
              }}>
                {viewingBuildLogsProj.logs || '[info] No log output recorded.'}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setViewingBuildLogsProj(null)}>Close logs</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER APP */}
      {isNewAppModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Register Daemon Application</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewAppModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Application Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. backend-api"
                  value={newAppName}
                  onChange={e => setNewAppName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Runtime Engine</label>
                <select 
                  className="form-input"
                  value={newAppRuntime}
                  onChange={e => setNewAppRuntime(e.target.value)}
                >
                  <option value="nodejs">Node.js</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="bun">Bun</option>
                  <option value="deno">Deno</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Startup Entry Point Script</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. server.js or main.py"
                  value={newAppEntryPoint}
                  onChange={e => setNewAppEntryPoint(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Port Binding to Expose</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="3000"
                  value={newAppPort}
                  onChange={e => setNewAppPort(e.target.value)}
                />
              </div>

              {/* Env Vars Section */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <label className="form-label">Environment Variables</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="KEY" 
                    value={newAppEnvKey} 
                    onChange={e => setNewAppEnvKey(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="VALUE" 
                    value={newAppEnvVal} 
                    onChange={e => setNewAppEnvVal(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn btn-secondary btn-small" 
                    onClick={() => {
                      if (newAppEnvKey.trim() && newAppEnvVal.trim()) {
                        setNewAppEnvVars([...newAppEnvVars, { key: newAppEnvKey.trim(), value: newAppEnvVal.trim() }]);
                        setNewAppEnvKey('');
                        setNewAppEnvVal('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {newAppEnvVars.map((v, i) => (
                    <span key={i} className="db-user-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {v.key}={v.value}
                      <X size={10} style={{ cursor: 'pointer' }} onClick={() => setNewAppEnvVars(newAppEnvVars.filter((_, idx) => idx !== i))} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewAppModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRegisterApp}>Register Application</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH CUSTOM CONTAINER */}
      {isLaunchContainerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Launch Custom Container Image</h3>
              <button className="btn-icon" style={{ border: 'none' }} onClick={() => setIsLaunchContainerModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Container Name / Label</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. ghost-blog"
                  value={launchContainerName}
                  onChange={e => setNewAppName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Docker Registry Image Name & Tag</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. ghost:alpine"
                  value={launchContainerImage}
                  onChange={e => setLaunchContainerImage(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Registry Profile (Optional)</label>
                <select className="form-input">
                  <option value="public">Docker Hub Public Registry</option>
                  {registriesList.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.url})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Port Bindings (HostPort:ContainerPort)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 8080:2368"
                  value={launchContainerPorts}
                  onChange={e => setLaunchContainerPorts(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsLaunchContainerModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleLaunchContainer}>Launch Container</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LINK PRIVATE REGISTRY */}
      {isNewRegistryModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateRegistry} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Link Private Container Registry</h3>
              <button type="button" className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewRegistryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Registry Provider Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. GitHub Container Registry (GHCR)"
                  value={newRegistryName}
                  onChange={e => setNewRegistryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Registry URL Endpoint</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. ghcr.io"
                  value={newRegistryUrl}
                  onChange={e => setNewRegistryUrl(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username / Account Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. keel-operator"
                  value={newRegistryUsername}
                  onChange={e => setNewRegistryUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Access Token / Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••••••"
                  value={newRegistryToken}
                  onChange={e => setNewRegistryToken(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsNewRegistryModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Link Registry</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE ALERT RULE */}
      {isNewAlertModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateAlertRule} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Create Webhook Alert Rule</h3>
              <button type="button" className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewAlertModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Alert Rule Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Memory Limit Warning"
                  value={newAlertName}
                  onChange={e => setNewAlertName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trigger Condition</label>
                <select 
                  className="form-input"
                  value={newAlertTrigger}
                  onChange={e => setNewAlertTrigger(e.target.value)}
                >
                  <option value="OutOfMemory">OutOfMemory Error Signature</option>
                  <option value="502BadGateway">502 Bad Gateway Response</option>
                  <option value="HighCPU">CPU load exceeds 95%</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Notification</label>
                <select 
                  className="form-input"
                  value={newAlertTarget}
                  onChange={e => setNewAlertTarget(e.target.value)}
                >
                  <option value="Slack Webhook">Slack Webhook URL</option>
                  <option value="Discord Webhook">Discord Webhook Channel</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Webhook Destination URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://hooks.slack.com/services/..."
                  value={newAlertEndpoint}
                  onChange={e => setNewAlertEndpoint(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsNewAlertModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Alert</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD DOMAIN CHECK */}
      {isNewMonitorModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateMonitor} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-semibold">Add HTTP Uptime Monitor</h3>
              <button type="button" className="btn-icon" style={{ border: 'none' }} onClick={() => setIsNewMonitorModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target Domain / Subdomain</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. blog.keel-wp.test"
                  value={newMonitorDomain}
                  onChange={e => setNewMonitorDomain(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Uptime ping tests will query this domain at standard HTTP/HTTPS ports. Webhook alert triggers will fire if a 5xx Bad Gateway is logged.
              </span>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsNewMonitorModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Monitor</button>
            </div>
          </form>
        </div>
      )}

      {/* GLOBAL COMMAND PALETTE */}
      {isCommandPaletteOpen && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '10vh' }} onClick={() => setIsCommandPaletteOpen(false)}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '600px', 
              width: '90%', 
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 0,
              overflow: 'hidden'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Terminal size={18} color="#3b82f6" />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search pages and quick actions... (e.g. Databases)"
                  value={commandQuery}
                  onChange={e => setCommandQuery(e.target.value)}
                  autoFocus
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    fontSize: '1rem', 
                    color: '#fff', 
                    padding: 0, 
                    margin: 0, 
                    boxShadow: 'none',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
              {filteredCommands.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No matches found for "{commandQuery}"
                </div>
              ) : (
                filteredCommands.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: idx === selectedIndex ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: idx === selectedIndex ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      item.action();
                      setIsCommandPaletteOpen(false);
                      setCommandQuery('');
                    }}
                  >
                    <span style={{ color: idx === selectedIndex ? '#3b82f6' : 'var(--text-secondary)' }}>{item.icon}</span>
                    <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: idx === selectedIndex ? 600 : 500 }}>{item.label}</span>
                    {idx === selectedIndex && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8 }}>Enter ↵</span>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div style={{ 
              padding: '10px 16px', 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)' 
            }}>
              <span>Use <kbd style={{ background: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '3px' }}>↑</kbd> <kbd style={{ background: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '3px' }}>↓</kbd> keys to navigate</span>
              <span><kbd style={{ background: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '3px' }}>Enter</kbd> to select • <kbd style={{ background: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '3px' }}>ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
