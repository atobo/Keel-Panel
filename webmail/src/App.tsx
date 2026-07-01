import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Inbox, 
  AlertOctagon, 
  Plus, 
  LogOut, 
  User, 
  Search,
  RefreshCw,
  BookOpen,
  Users,
  UserPlus,
  Trash2,
  Edit,
  } from 'lucide-react';
import './index.css';
import logoIcon from './assets/logo-icon.png';
import logoText from './assets/logo-text.png';

function App() {
  const [token, setToken] = useState(localStorage.getItem('hf_mail_token') || '');
  const [emailAddress, setEmailAddress] = useState(localStorage.getItem('hf_mail_address') || '');

  // Redirect relative API requests to backend port 3001
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init: any = {}) => {
      let url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.startsWith('/api/')) {
        const backendPort = '3001';
        const backendUrl = `${window.location.protocol}//${window.location.hostname}:${backendPort}${url}`;
        if (typeof input === 'string') {
          input = backendUrl;
        } else {
          (input as any).url = backendUrl;
        }
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Mailbox States
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'spam' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<{ filename: string, content: string, contentType: string }[]>([]);
  const [sending, setSending] = useState(false);

  // Address Book & Mailing List state
  const [activeView, setActiveView] = useState<'mail' | 'contacts'>('mail');
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('All');
  
  // Contact Add/Edit modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactGroupsString, setContactGroupsString] = useState('');

  // Autocomplete Suggestions
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [ccSuggestions, setCcSuggestions] = useState<any[]>([]);
  const [bccSuggestions, setBccSuggestions] = useState<any[]>([]);

  // Search/Filter Contacts
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  
  // Helper to resolve stable group colors
  const getGroupColor = (groupName: string) => {
    const found = groups.find(g => typeof g === 'object' && g !== null && g.name.toLowerCase() === groupName.toLowerCase());
    const colorVal = found?.color || '#14b8a6';
    const available = [
      { bg: 'rgba(20, 184, 166, 0.08)', text: '#14b8a6', border: 'rgba(20, 184, 166, 0.2)' }, // Teal
      { bg: 'rgba(59, 130, 246, 0.08)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' }, // Blue
      { bg: 'rgba(139, 92, 246, 0.08)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' }, // Purple
      { bg: 'rgba(236, 72, 153, 0.08)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.2)' }, // Pink
      { bg: 'rgba(249, 115, 22, 0.08)', text: '#f97316', border: 'rgba(249, 115, 22, 0.2)' }, // Orange
      { bg: 'rgba(16, 185, 129, 0.08)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' }  // Green
    ];
    const match = available.find(c => c.text === colorVal);
    return match || { bg: 'rgba(20, 184, 166, 0.08)', text: colorVal, border: 'rgba(20, 184, 166, 0.2)' };
  };

  // Group suggestions inside contact modal
  const [groupSuggestions, setGroupSuggestions] = useState<string[]>([]);

  // List of custom groups from backend
  const [groups, setGroups] = useState<any[]>([
    { name: 'Team', color: '#14b8a6' },
    { name: 'Clients', color: '#3b82f6' },
    { name: 'Partners', color: '#8b5cf6' }
  ]);

  // Edit Group Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormColor, setGroupFormColor] = useState('#14b8a6');

  // Auto-Login / SSO Check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoEmail = params.get('email');
    const ssoToken = params.get('token');
    if (ssoEmail && ssoToken) {
      localStorage.setItem('hf_mail_token', ssoToken);
      localStorage.setItem('hf_mail_address', ssoEmail);
      setToken(ssoToken);
      setEmailAddress(ssoEmail);
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch email list
  const fetchMessages = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/emails/webmail/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      // Filter messages to only show those involving our email address
      const myMsgs = (data.messages || []).filter((msg: any) => {
        return msg.from.toLowerCase() === emailAddress.toLowerCase() || 
               msg.to.toLowerCase() === emailAddress.toLowerCase();
      });
      setMessages(myMsgs);
    } catch (err) {
      console.error('Failed to load email messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && emailAddress) {
      fetchMessages();
      fetchContacts();
      fetchGroups();
    }
  }, [token, emailAddress]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/emails/webmail/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/emails/webmail/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Error fetching groups', err);
    }
  };

  const handleCreateGroup = async (groupName: string) => {
    if (!groupName.trim()) return;
    try {
      const res = await fetch('/api/emails/webmail/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName.trim(), color: '#14b8a6' })
      });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
        if (data.contacts) setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error creating group', err);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName.trim()) return;
    try {
      const res = await fetch('/api/emails/webmail/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          oldName: editingGroup?.name, 
          name: groupFormName.trim(), 
          color: groupFormColor 
        })
      });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
        if (data.contacts) setContacts(data.contacts);
        setIsGroupModalOpen(false);
        setGroupFormName('');
        setEditingGroup(null);
        if (editingGroup && activeGroup === editingGroup.name) {
          setActiveGroup(groupFormName.trim());
        }
      }
    } catch (err) {
      console.error('Error saving group', err);
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This will also remove it from any contacts.`)) return;
    try {
      const res = await fetch(`/api/emails/webmail/groups/${encodeURIComponent(groupName)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
        if (data.contacts) setContacts(data.contacts);
        if (activeGroup === groupName) setActiveGroup('All');
      }
    } catch (err) {
      console.error('Error deleting group', err);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;
    
    const groupsArray = contactGroupsString
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);

    try {
      const res = await fetch('/api/emails/webmail/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingContact?.id,
          name: contactName.trim(),
          email: contactEmail.trim(),
          groups: groupsArray
        })
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        setIsContactModalOpen(false);
        setContactName('');
        setContactEmail('');
        setContactGroupsString('');
        setEditingContact(null);
      } else {
        alert(data.error || 'Failed to save contact');
      }
    } catch (err) {
      alert('Error saving contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`/api/emails/webmail/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      alert('Error deleting contact');
    }
  };

  const openAddContactModal = () => {
    setEditingContact(null);
    setContactName('');
    setContactEmail('');
    setContactGroupsString('');
    setIsContactModalOpen(true);
  };

  const openEditContactModal = (contact: any) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email);
    setContactGroupsString((contact.groups || []).join(', '));
    setIsContactModalOpen(true);
  };

  // Group suggestions inside contact modal
  const handleGroupStringChange = (val: string) => {
    setContactGroupsString(val);
    const tokens = val.split(/,\s*/);
    const lastToken = tokens.pop() || '';
    if (!lastToken.trim()) {
      setGroupSuggestions([]);
      return;
    }
    const term = lastToken.toLowerCase();
    const allGroups = groups.map((g: any) => g.name);
    const matched = allGroups.filter((g: string) => 
      g.toLowerCase().includes(term) && !tokens.map(t => t.toLowerCase()).includes(g.toLowerCase())
    );
    setGroupSuggestions(matched);
  };

  const selectGroupSuggestion = (groupName: string) => {
    const tokens = contactGroupsString.split(/,\s*/);
    tokens.pop(); // remove typed token
    tokens.push(groupName);
    setContactGroupsString(tokens.join(', ') + ', ');
    setGroupSuggestions([]);
  };

  // Autocomplete change and select logic
  const handleRecipientChange = (val: string, field: 'to' | 'cc' | 'bcc') => {
    if (field === 'to') setComposeTo(val);
    else if (field === 'cc') setComposeCc(val);
    else if (field === 'bcc') setComposeBcc(val);

    const lastToken = val.split(/,\s*/).pop() || '';
    if (!lastToken.trim()) {
      if (field === 'to') setToSuggestions([]);
      else if (field === 'cc') setCcSuggestions([]);
      else if (field === 'bcc') setBccSuggestions([]);
      return;
    }

    const term = lastToken.toLowerCase();
    
    // Suggest contacts
    const matchedContacts = contacts.filter(c => 
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    ).map(c => ({ label: `${c.name} <${c.email}>`, value: c.email, type: 'contact' }));

    // Suggest groups
    const allGroups = groups.map((g: any) => g.name);
    const matchedGroups = allGroups.filter((g: string) => 
      g.toLowerCase().includes(term)
    ).map((g: string) => ({ label: `Group: ${g}`, value: g, type: 'group' }));

    const merged = [...matchedGroups, ...matchedContacts];
    if (field === 'to') setToSuggestions(merged);
    else if (field === 'cc') setCcSuggestions(merged);
    else if (field === 'bcc') setBccSuggestions(merged);
  };

  const selectSuggestion = (item: any, field: 'to' | 'cc' | 'bcc') => {
    let currentVal = '';
    if (field === 'to') currentVal = composeTo;
    else if (field === 'cc') currentVal = composeCc;
    else if (field === 'bcc') currentVal = composeBcc;

    const tokens = currentVal.split(/,\s*/);
    tokens.pop(); // Remove the typed token

    let textToAdd = '';
    if (item.type === 'group') {
      // Expand group members
      const groupContacts = contacts.filter(c => c.groups && c.groups.includes(item.value));
      textToAdd = groupContacts.map(c => c.email).join(', ');
    } else {
      textToAdd = item.value;
    }

    tokens.push(textToAdd);
    // Keep it clean with commas
    const newVal = tokens.join(', ') + ', ';

    if (field === 'to') {
      setComposeTo(newVal);
      setToSuggestions([]);
    } else if (field === 'cc') {
      setComposeCc(newVal);
      setCcSuggestions([]);
    } else if (field === 'bcc') {
      setComposeBcc(newVal);
      setBccSuggestions([]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter email and password');
      return;
    }
    
    // Simulate webmail login / check credentials
    try {
      // We call standard auth login backend endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'tenant1', password: loginPassword }) // Using mock tenant login for simplicity
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('hf_mail_token', data.token);
        localStorage.setItem('hf_mail_address', loginEmail.trim());
        setToken(data.token);
        setEmailAddress(loginEmail.trim());
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Authentication server offline');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hf_mail_token');
    localStorage.removeItem('hf_mail_address');
    setToken('');
    setEmailAddress('');
    setSelectedMessage(null);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const editorHtml = document.getElementById('webmail-editor')?.innerHTML || '';
    if (!composeTo.trim() || !composeSubject.trim() || !editorHtml.trim() || editorHtml === '<br>') {
      alert('All fields are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/emails/webmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from: emailAddress,
          to: composeTo.trim(),
          cc: composeCc.trim(),
          bcc: composeBcc.trim(),
          subject: composeSubject.trim(),
          body: editorHtml,
          attachments: composeAttachments
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        fetchMessages();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      alert('Error sending mail');
    } finally {
      setSending(false);
    }
  };

  // Filter messages for rendering
  const filteredMessages = messages.filter(msg => {
    // 1. Folder filter
    const isSent = msg.from.toLowerCase() === emailAddress.toLowerCase();
    const isToMe = msg.to.toLowerCase() === emailAddress.toLowerCase();
    if (activeFolder === 'sent' && !isSent) return false;
    if (activeFolder === 'inbox' && isSent && !isToMe) return false;
    if (activeFolder === 'spam' && activeFolder !== msg.folder) return false; // simulated folders
    
    // 2. Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return msg.subject.toLowerCase().includes(query) || 
             msg.from.toLowerCase().includes(query) || 
             msg.to.toLowerCase().includes(query) || 
             msg.body.toLowerCase().includes(query);
    }
    return true;
  });

  if (!token) {
    return (
      <div className="login-wrapper">
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
        <form className="login-card" onSubmit={handleLogin} style={{ zIndex: 1, position: 'relative' }}>
          <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <img src={logoIcon} style={{ width: '56px', height: '56px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', marginBottom: '8px' }} alt="Logo" />
            <h2 style={{
              fontSize: '1.25rem',
              letterSpacing: '2px',
              fontFamily: 'Syncopate, sans-serif',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginTop: '12px'
            }}>Keel Webmail</h2>
            <p>Access your isolated tenant inbox</p>
          </div>
          
          {loginError && <div className="login-error-alert">{loginError}</div>}
          
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. admin@keel-wp.test" 
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary-block">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mail-container">
      {/* Sidebar navigation */}
      <div className="mail-sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoIcon} style={{ width: '22px', height: '22px', borderRadius: '4px' }} alt="Icon" />
          <span>Keel Webmail</span>
        </div>
        
        <button className="btn-compose" onClick={() => setIsComposeOpen(true)}>
          <Plus size={16} />
          <span>New Message</span>
        </button>

        <div className="sidebar-folders">
          <button 
            className={`folder-item ${activeView === 'mail' && activeFolder === 'inbox' ? 'active' : ''}`}
            onClick={() => { setActiveView('mail'); setActiveFolder('inbox'); setSelectedMessage(null); }}
          >
            <Inbox size={18} />
            <span>Inbox</span>
            <span className="count-badge">
              {messages.filter(m => m.from.toLowerCase() !== emailAddress.toLowerCase()).length}
            </span>
          </button>
          
          <button 
            className={`folder-item ${activeView === 'mail' && activeFolder === 'sent' ? 'active' : ''}`}
            onClick={() => { setActiveView('mail'); setActiveFolder('sent'); setSelectedMessage(null); }}
          >
            <Send size={18} />
            <span>Sent</span>
          </button>

          <button 
            className={`folder-item ${activeView === 'contacts' ? 'active' : ''}`}
            onClick={() => { setActiveView('contacts'); setSelectedMessage(null); }}
            style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            <BookOpen size={18} />
            <span>Address Book</span>
          </button>

          <button 
            className={`folder-item ${activeFolder === 'spam' ? 'active' : ''}`}
            onClick={() => { setActiveFolder('spam'); setSelectedMessage(null); }}
          >
            <AlertOctagon size={18} />
            <span>Spam</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <User size={16} />
            <span title={emailAddress}>{emailAddress.length > 20 ? `${emailAddress.substring(0, 18)}...` : emailAddress}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {activeView === 'contacts' ? (
        /* Address Book Split Panel */
        <div className="address-book-panel fade-in">
          <div className="contacts-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Groups</h3>
            
            <div className="new-group-input-container" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="text" 
                placeholder="Add new group + Enter" 
                className="form-input" 
                style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: '#1f2937', color: '#fff', width: '100%', outline: 'none' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      await handleCreateGroup(val);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>

            <button 
              className={`group-item ${activeGroup === 'All' ? 'active' : ''}`}
              onClick={() => { setActiveGroup('All'); setContactSearchQuery(''); }}
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 12px', background: activeGroup === 'All' ? 'rgba(20, 184, 166, 0.1)' : 'none', border: 'none', color: activeGroup === 'All' ? '#14b8a6' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
            >
              <span>All Contacts</span>
              <span className="group-count" style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-secondary)' }}>{contacts.length}</span>
            </button>
            
            {groups.map((g: any) => (
              <div 
                key={g.name}
                className={`group-item-container ${activeGroup === g.name ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: activeGroup === g.name ? 'rgba(20, 184, 166, 0.1)' : 'transparent', border: activeGroup === g.name ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid transparent' }}
                onClick={() => { setActiveGroup(g.name); setContactSearchQuery(''); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getGroupColor(g.name).text, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: activeGroup === g.name ? '#fff' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                </div>
                <div className="group-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                    onClick={() => {
                      setEditingGroup(g);
                      setGroupFormName(g.name);
                      setGroupFormColor(g.color || '#14b8a6');
                      setIsGroupModalOpen(true);
                    }}
                    title="Edit Group Color & Name"
                  >
                    <Edit size={12} />
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                    onClick={() => handleDeleteGroup(g.name)}
                    title="Delete Group"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="group-count" style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-secondary)', minWidth: '20px', textAlign: 'center' }}>
                    {contacts.filter(c => c.groups && c.groups.includes(g.name)).length}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="contacts-content">
            <div className="contacts-header">
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{activeGroup === 'All' ? 'All Contacts' : `Group: ${activeGroup}`}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Manage and organize client or team mailing lists
                </p>
              </div>
              <button className="btn btn-primary" onClick={openAddContactModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                <span>Add Contact</span>
              </button>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search contacts by name or email..." 
                  value={contactSearchQuery}
                  onChange={e => setContactSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {contacts.length === 0 ? (
              <div className="detail-empty-state" style={{ flex: 1 }}>
                <Users size={48} color="rgba(255,255,255,0.1)" />
                <p>No contacts found. Click "Add Contact" to create one.</p>
              </div>
            ) : (
              <div className="contacts-grid">
                {contacts
                  .filter(c => activeGroup === 'All' || (c.groups && c.groups.includes(activeGroup)))
                  .filter(c => {
                    const term = contactSearchQuery.toLowerCase().trim();
                    if (!term) return true;
                    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
                  })
                  .map(contact => (
                    <div key={contact.id} className="contact-card">
                      <div className="contact-card-header">
                        <div className="contact-avatar">
                          {contact.name[0].toUpperCase()}
                        </div>
                        <div className="contact-info">
                          <div className="contact-name">{contact.name}</div>
                          <div className="contact-email">{contact.email}</div>
                        </div>
                      </div>
                      
                      {contact.groups && contact.groups.length > 0 && (
                        <div className="contact-groups">
                          {contact.groups.map((g: string) => {
                            const colors = getGroupColor(g);
                            return (
                              <span 
                                key={g} 
                                className="group-tag"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderColor: colors.border
                                }}
                              >
                                {g}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="contact-actions">
                        <button className="contact-action-btn" onClick={() => openEditContactModal(contact)} title="Edit Contact">
                          <Edit size={14} />
                        </button>
                        <button className="contact-action-btn delete" onClick={() => handleDeleteContact(contact.id)} title="Delete Contact">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Message List Panel */}
          <div className="mail-list-panel">
        <div className="list-search-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search mail..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={fetchMessages} disabled={loading} title="Refresh mail">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <div className="list-scroll-area">
          {loading && messages.length === 0 ? (
            <div className="loading-state">Syncing inbox...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="empty-state">No messages in this folder</div>
          ) : (
            filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mail-item-card ${selectedMessage?.id === msg.id ? 'selected' : ''}`}
                onClick={() => setSelectedMessage(msg)}
              >
                <div className="mail-item-header">
                  <span className="mail-item-sender">
                    {msg.from.toLowerCase() === emailAddress.toLowerCase() ? `To: ${msg.to}` : msg.from}
                  </span>
                  <span className="mail-item-date">{msg.date}</span>
                </div>
                <div className="mail-item-subject">{msg.subject}</div>
                <div className="mail-item-preview">{msg.body}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail Panel */}
      <div className="mail-detail-panel">
        {selectedMessage ? (
          <div className="message-view fade-in">
            <div className="message-header">
              <h2 className="message-subject">{selectedMessage.subject}</h2>
              <div className="message-meta">
                <div className="sender-info">
                  <div className="sender-avatar">{selectedMessage.from[0].toUpperCase()}</div>
                  <div>
                    <div className="sender-name">{selectedMessage.from}</div>
                    <div className="recipient-info">to {selectedMessage.to}</div>
                    {selectedMessage.cc && <div className="recipient-info" style={{ marginTop: '2px', fontSize: '0.75rem', opacity: 0.8 }}>cc: {selectedMessage.cc}</div>}
                    {selectedMessage.bcc && (selectedMessage.from.toLowerCase() === emailAddress.toLowerCase()) && (
                      <div className="recipient-info" style={{ marginTop: '2px', fontSize: '0.75rem', color: 'var(--accent-purple)', opacity: 0.85 }}>bcc: {selectedMessage.bcc} <span style={{ fontSize: '0.65rem', fontStyle: 'italic' }}>(only visible to you)</span></div>
                    )}
                  </div>
                </div>
                <div className="message-date">{selectedMessage.date}</div>
              </div>
            </div>
            <div className="message-body">
              {/<[a-z][\s\S]*>/i.test(selectedMessage.body) ? (
                <div dangerouslySetInnerHTML={{ __html: selectedMessage.body }} />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.body}</div>
              )}
              
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="message-attachments" style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#94a3b8' }}>
                    Attachments ({selectedMessage.attachments.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedMessage.attachments.map((att: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={att.url} 
                        download={att.filename}
                        className="attachment-download-link"
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#f8fafc',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#14b8a6';
                          e.currentTarget.style.background = '#0f172a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#334155';
                          e.currentTarget.style.background = '#1e293b';
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{att.filename}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Download</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="detail-empty-state">
            <Mail size={48} color="rgba(255,255,255,0.1)" />
            <p>Select an email message to read</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Add / Edit Contact Modal */}
      {isContactModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleSaveContact} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
              <button type="button" className="close-btn" onClick={() => setIsContactModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Contact Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group autocomplete-container">
                <label>Mailing Groups (comma separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Team, Clients"
                  value={contactGroupsString}
                  onChange={e => handleGroupStringChange(e.target.value)}
                  onBlur={() => setTimeout(() => setGroupSuggestions([]), 200)}
                />
                {groupSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {groupSuggestions.map((g, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item"
                        onMouseDown={() => selectGroupSuggestion(g)}
                      >
                        <span>{g}</span>
                        <span className="suggestion-type">group</span>
                      </div>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Assigning a group name allows expanding all group members when typing in composition fields.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsContactModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Contact</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Group Modal */}
      {isGroupModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleSaveGroup} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Edit Group</h2>
              <button type="button" className="close-btn" onClick={() => setIsGroupModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Group Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={groupFormName}
                  onChange={e => setGroupFormName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ marginBottom: '8px', display: 'block' }}>Group Color</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: '#14b8a6', label: 'Teal' },
                    { value: '#3b82f6', label: 'Blue' },
                    { value: '#8b5cf6', label: 'Purple' },
                    { value: '#ec4899', label: 'Pink' },
                    { value: '#f97316', label: 'Orange' },
                    { value: '#10b981', label: 'Green' }
                  ].map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setGroupFormColor(c.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: c.value,
                        border: groupFormColor === c.value ? '2px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsGroupModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSendMessage}>
            <div className="modal-header">
              <h3>Compose Message</h3>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsComposeOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>From</label>
                <input type="text" className="form-input" value={emailAddress} disabled />
              </div>
              <div className="form-group autocomplete-container">
                <label>To</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="recipient@example.com or Group name..." 
                  value={composeTo}
                  onChange={e => handleRecipientChange(e.target.value, 'to')}
                  onBlur={() => setTimeout(() => setToSuggestions([]), 200)}
                  required 
                />
                {toSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {toSuggestions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item"
                        onMouseDown={() => selectSuggestion(item, 'to')}
                      >
                        <span>{item.label}</span>
                        <span className="suggestion-type">{item.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group autocomplete-container" style={{ flex: 1 }}>
                  <label>Cc (optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="cc@example.com" 
                    value={composeCc}
                    onChange={e => handleRecipientChange(e.target.value, 'cc')}
                    onBlur={() => setTimeout(() => setCcSuggestions([]), 200)}
                  />
                  {ccSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {ccSuggestions.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item"
                          onMouseDown={() => selectSuggestion(item, 'cc')}
                        >
                          <span>{item.label}</span>
                          <span className="suggestion-type">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group autocomplete-container" style={{ flex: 1 }}>
                  <label>Bcc (optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="bcc@example.com" 
                    value={composeBcc}
                    onChange={e => handleRecipientChange(e.target.value, 'bcc')}
                    onBlur={() => setTimeout(() => setBccSuggestions([]), 200)}
                  />
                  {bccSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {bccSuggestions.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item"
                          onMouseDown={() => selectSuggestion(item, 'bcc')}
                        >
                          <span>{item.label}</span>
                          <span className="suggestion-type">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Subject line" 
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Message Content</label>
                <div className="wysiwyg-toolbar" style={{
                  display: 'flex',
                  gap: '6px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0',
                  padding: '6px 12px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button 
                    type="button" 
                    title="Bold"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', fontWeight: 'bold', cursor: 'pointer', padding: '4px 8px' }}
                    onClick={() => document.execCommand('bold', false)}
                  >
                    B
                  </button>
                  <button 
                    type="button" 
                    title="Italic"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', fontStyle: 'italic', cursor: 'pointer', padding: '4px 8px' }}
                    onClick={() => document.execCommand('italic', false)}
                  >
                    I
                  </button>
                  <button 
                    type="button" 
                    title="Underline"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', textDecoration: 'underline', cursor: 'pointer', padding: '4px 8px' }}
                    onClick={() => document.execCommand('underline', false)}
                  >
                    U
                  </button>
                  
                  <span style={{ borderLeft: '1px solid #475569', height: '16px', margin: '0 4px' }} />
                  
                  <select 
                    title="Font Size"
                    style={{ background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', borderRadius: '4px', fontSize: '12px', padding: '2px 4px' }}
                    onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                  >
                    <option value="3">Normal</option>
                    <option value="1">Small</option>
                    <option value="4">Medium</option>
                    <option value="5">Large</option>
                    <option value="6">Extra Large</option>
                  </select>
                  
                  <span style={{ borderLeft: '1px solid #475569', height: '16px', margin: '0 4px' }} />
                  
                  <button 
                    type="button" 
                    title="Align Left"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '4px' }}
                    onClick={() => document.execCommand('justifyLeft', false)}
                  >
                    ⬅
                  </button>
                  <button 
                    type="button" 
                    title="Align Center"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '4px' }}
                    onClick={() => document.execCommand('justifyCenter', false)}
                  >
                    ↔
                  </button>
                  <button 
                    type="button" 
                    title="Align Right"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '4px' }}
                    onClick={() => document.execCommand('justifyRight', false)}
                  >
                    ➡
                  </button>
                  
                  <span style={{ borderLeft: '1px solid #475569', height: '16px', margin: '0 4px' }} />
                  
                  <button 
                    type="button" 
                    title="Bulleted List"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '4px' }}
                    onClick={() => document.execCommand('insertUnorderedList', false)}
                  >
                    • List
                  </button>
                  <button 
                    type="button" 
                    title="Numbered List"
                    style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '4px' }}
                    onClick={() => document.execCommand('insertOrderedList', false)}
                  >
                    1. List
                  </button>
                </div>
                
                <div 
                  id="webmail-editor"
                  className="wysiwyg-editor form-textarea"
                  contentEditable={true}
                  style={{
                    border: '1px solid #334155',
                    borderRadius: '0 0 6px 6px',
                    minHeight: '200px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '12px'
                  }}
                  dangerouslySetInnerHTML={{ __html: composeBody || '' }}
                />
              </div>
              <div className="form-group">
                <label>Attachments</label>
                <input 
                  type="file" 
                  multiple 
                  className="form-input" 
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files) return;
                    
                    const newAtts = [...composeAttachments];
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const reader = new FileReader();
                      
                      const readFile = () => new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                      });
                      
                      const dataUrl = await readFile();
                      newAtts.push({
                        filename: file.name,
                        contentType: file.type || 'application/octet-stream',
                        content: dataUrl
                      });
                    }
                    setComposeAttachments(newAtts);
                    // Reset value so the same file can be selected again if removed
                    e.target.value = '';
                  }}
                />
                {composeAttachments.length > 0 && (
                  <div className="compose-attachments-list" style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {composeAttachments.map((att, idx) => (
                      <div key={idx} className="attachment-chip" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '4px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{att.filename}</span>
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' }}
                          onClick={() => {
                            setComposeAttachments(composeAttachments.filter((_, itemIdx) => itemIdx !== idx));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsComposeOpen(false)}
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
