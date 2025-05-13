import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, TextField, Button, Box, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Chip, Slider, Divider, List, ListItem, ListItemText,
  ListItemSecondaryAction, Paper, Alert, Grid, MenuItem
} from '@mui/material';
import { Add, Delete, ExpandMore, Brightness4, Brightness7 } from '@mui/icons-material';
import { motion } from 'framer-motion';

// Types for decision data
interface ProCon {
  text: string;
  weight: number; // 1-10 importance score
}

interface Decision {
  id: string;
  title: string;
  pros: ProCon[];
  cons: ProCon[];
  outcomes: string[];
  chosenOption: string;
  actualOutcome: string;
  createdAt: string;
  isComplete: boolean;
}

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DecisionJournal: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // State management
  const [decisions, setDecisions] = useState<Decision[]>(() => {
    const saved = localStorage.getItem('decisions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeView, setActiveView] = useState<'form' | 'history'>('form');
  const [currentDecision, setCurrentDecision] = useState<Decision>({
    id: Date.now().toString(),
    title: '',
    pros: [],
    cons: [],
    outcomes: [],
    chosenOption: '',
    actualOutcome: '',
    createdAt: new Date().toISOString(),
    isComplete: false,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [finalOutcome, setFinalOutcome] = useState<string>('');
  
  // Input state for controlled components
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');

  // Get selected decision
  const selectedDecision = useMemo(() => 
    decisions.find(d => d.id === selectedDecisionId),
    [decisions, selectedDecisionId]
  );

  // Handle decision selection
  const handleDecisionSelect = (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    setFinalOutcome('');
  };

  // Handle final outcome change
  const handleFinalOutcomeChange = (outcome: string) => {
    setFinalOutcome(outcome);
    if (selectedDecision) {
      updateDecisionWithValidation(selectedDecision.id, { 
        chosenOption: outcome,
        actualOutcome: outcome 
      });
    }
  };

  // Persist decisions to local storage
  useEffect(() => {
    try {
      localStorage.setItem('decisions', JSON.stringify(decisions));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [decisions]);

  // Reset form for new decision
  const resetForm = () => {
    setCurrentDecision({
      id: Date.now().toString(),
      title: '',
      pros: [],
      cons: [],
      outcomes: [],
      chosenOption: '',
      actualOutcome: '',
      createdAt: new Date().toISOString(),
      isComplete: false,
    });
    setEditId(null);
    setProInput('');
    setConInput('');
    setOutcomeInput('');
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDecision.title) return;
    if (editId) {
      setDecisions(decisions.map(d => d.id === editId ? currentDecision : d));
    } else {
      setDecisions([currentDecision, ...decisions]);
    }
    resetForm();
  };

  // Edit existing decision
  const handleEdit = (id: string) => {
    const decision = decisions.find(d => d.id === id);
    if (decision) {
      setCurrentDecision(decision);
      setEditId(id);
      setActiveView('form');
    }
  };

  // Mark decision as complete
  const handleComplete = () => {
    if (currentDecision.chosenOption) {
      setCurrentDecision({ ...currentDecision, isComplete: true });
      setDecisions(decisions.map(d => d.id === currentDecision.id ? { ...currentDecision, isComplete: true } : d));
    }
  };

  // Add pro, con, or outcome
  const addItem = (type: 'pros' | 'cons' | 'outcomes', text: string, weight = 5) => {
    if (!text.trim()) return;
    const newItem = type === 'outcomes' ? text : { text: text.trim(), weight };
    setCurrentDecision({
      ...currentDecision,
      [type]: [...currentDecision[type], newItem],
    });
  };

  // Remove item
  const removeItem = (type: 'pros' | 'cons' | 'outcomes', index: number) => {
    setCurrentDecision({
      ...currentDecision,
      [type]: currentDecision[type].filter((_, i) => i !== index),
    });
  };

  // Update weight for pro/con
  const updateWeight = (type: 'pros' | 'cons', index: number, weight: number) => {
    setCurrentDecision({
      ...currentDecision,
      [type]: currentDecision[type].map((item: ProCon, i) =>
        i === index ? { ...item, weight } : item
      ),
    });
  };

  // Handle input changes
  const handleProInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProInput(e.target.value);
  };

  const handleConInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConInput(e.target.value);
  };

  const handleOutcomeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOutcomeInput(e.target.value);
  };

  // Handle input submissions
  const handleProSubmit = () => {
    if (proInput.trim()) {
      addItem('pros', proInput);
      setProInput('');
    }
  };

  const handleConSubmit = () => {
    if (conInput.trim()) {
      addItem('cons', conInput);
      setConInput('');
    }
  };

  const handleOutcomeSubmit = () => {
    if (outcomeInput.trim()) {
      addItem('outcomes', outcomeInput);
      setOutcomeInput('');
    }
  };

  // Add delete decision function
  const handleDeleteDecision = (id: string) => {
    setDecisions(decisions.filter(d => d.id !== id));
  };

  // Validate chosen option
  const validateChosenOption = (decision: Decision, chosenOption: string): boolean => {
    if (!chosenOption) return true; // Empty is valid
    return decision.outcomes.includes(chosenOption);
  };

  // Update decision with validation
  const updateDecisionWithValidation = (id: string, updates: Partial<Decision>) => {
    const decision = decisions.find(d => d.id === id);
    if (decision) {
      if (updates.chosenOption && !validateChosenOption(decision, updates.chosenOption)) {
        setErrorMessage(`Chosen option must be one of: ${decision.outcomes.join(', ')}`);
        return;
      }
      setErrorMessage(null);
      setDecisions(decisions.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  // Memoized decision list for history view
  const decisionList = useMemo(() => decisions.map(d => (
    <motion.div key={d.id} variants={itemVariants}>
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          border: `1px solid ${darkMode ? '#353a45' : '#e3e6ee'}`,
          mb: 2,
          borderRadius: 2,
          background: darkMode ? '#23272f' : '#fff',
          color: darkMode ? '#fff' : '#222',
          '&:before': { display: 'none' },
          boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: darkMode ? '#fff' : '#222' }} />}
          sx={{
            background: darkMode ? '#23272f' : '#fff',
            color: darkMode ? '#fff' : '#222',
            borderRadius: 2,
            minHeight: 56,
            '& .MuiAccordionSummary-content': {
              fontWeight: 600,
              fontSize: 18,
            },
          }}
        >
          <Typography variant="h6" sx={{ color: darkMode ? '#fff' : '#222' }}>{d.title}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ background: darkMode ? '#23272f' : '#fff', color: darkMode ? '#fff' : '#222', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Decision Details</Typography>
              <Typography><strong>Pros:</strong> {d.pros.map(p => `${p.text} (Weight: ${p.weight})`).join(', ') || 'None'}</Typography>
              <Typography><strong>Cons:</strong> {d.cons.map(c => `${c.text} (Weight: ${c.weight})`).join(', ') || 'None'}</Typography>
              <Typography><strong>Potential Outcomes:</strong> {d.outcomes.join(', ') || 'None'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button onClick={() => handleEdit(d.id)}>Edit</Button>
                <Button 
                  color="error" 
                  onClick={() => handleDeleteDecision(d.id)}
                  startIcon={<Delete />}
                >
                  Delete
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </motion.div>
  )), [decisions, darkMode]);

  const handleThemeToggle = () => setDarkMode((prev) => !prev);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#23272f' : '#f5f6fa', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ bgcolor: darkMode ? '#282c34' : '#fff', py: 6, boxShadow: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h3" align="center" fontWeight={700} gutterBottom sx={{ color: darkMode ? '#fff' : '#222' }}>
            Decision Journal
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ color: darkMode ? '#b0b8c1' : '#555', mb: 3 }}>
            Reflect on your choices. Track your thinking. Learn from outcomes.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleThemeToggle}
              startIcon={darkMode ? <Brightness7 /> : <Brightness4 />}
              sx={{
                borderRadius: 999,
                px: 3,
                background: darkMode ? '#23272f' : '#e3e6ee',
                color: darkMode ? '#fff' : '#222',
                boxShadow: 2,
                fontWeight: 600,
                '&:hover': {
                  background: darkMode ? '#23272f' : '#d1d5db',
                },
              }}
            >
              Theme ({darkMode ? 'to Light' : 'to Dark'})
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant={activeView === 'form' ? 'contained' : 'outlined'}
            onClick={() => { setActiveView('form'); if (!editId) resetForm(); }}
            sx={{ mr: 1 }}
          >
            New Decision
          </Button>
          <Button
            variant={activeView === 'history' ? 'contained' : 'outlined'}
            onClick={() => setActiveView('history')}
          >
            History
          </Button>
        </Box>

        {activeView === 'form' ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                background: darkMode ? '#23272f' : '#fff',
                color: darkMode ? '#fff' : '#222',
                boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                border: `1px solid ${darkMode ? '#353a45' : '#e3e6ee'}`,
              }}
            >
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Decision Title"
                  value={currentDecision.title}
                  onChange={e => setCurrentDecision({ ...currentDecision, title: e.target.value })}
                  required
                  margin="normal"
                  InputProps={{
                    sx: {
                      background: darkMode ? '#23272f' : '#fff',
                      color: darkMode ? '#fff' : '#222',
                    }
                  }}
                  InputLabelProps={{
                    sx: {
                      color: darkMode ? '#b0b8c1' : '#555',
                    }
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: darkMode ? '#353a45' : '#ccc',
                      },
                      '&:hover fieldset': {
                        borderColor: darkMode ? '#90caf9' : '#1976d2',
                      },
                    },
                  }}
                />
                {/* Pros */}
                <Typography variant="h6" sx={{ mt: 2 }}>Pros</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    placeholder="Add Pro"
                    size="small"
                    value={proInput}
                    onChange={handleProInputChange}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleProSubmit();
                      }
                    }}
                    fullWidth
                    InputProps={{
                      sx: {
                        background: darkMode ? '#23272f' : '#fff',
                        color: darkMode ? '#fff' : '#222',
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: darkMode ? '#b0b8c1' : '#555',
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkMode ? '#353a45' : '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: darkMode ? '#90caf9' : '#1976d2',
                        },
                      },
                    }}
                  />
                  <Button
                    onClick={handleProSubmit}
                    startIcon={<Add />}
                    sx={{
                      borderRadius: 1,
                      background: darkMode ? '#1976d2' : '#1976d2',
                      color: '#fff',
                      boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                      minWidth: 120,
                      fontWeight: 600,
                      '&:hover': {
                        background: darkMode ? '#1565c0' : '#1565c0',
                      },
                    }}
                  >
                    ADD
                  </Button>
                </Box>
                <List>
                  {currentDecision.pros.map((pro, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: darkMode ? '#2d323b' : '#f5f6fa',
                        border: `1px solid ${darkMode ? '#444b58' : '#e3e6ee'}`,
                        borderRadius: 2,
                        mb: 1,
                        px: 2,
                        py: 1.5,
                        width: '100%',
                      }}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => removeItem('pros', index)} sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}>
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={<span style={{ fontWeight: 600, fontSize: 16 }}>{pro.text}</span>}
                        secondary={null}
                      />
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: darkMode ? '#b0b8c1' : '#555' }}>
                          Weight: {pro.weight}
                        </Typography>
                        <Slider
                          value={pro.weight}
                          min={1}
                          max={10}
                          onChange={(_, val) => updateWeight('pros', index, val as number)}
                          size="small"
                          sx={{ color: darkMode ? '#90caf9' : '#1976d2', ml: 1, mr: 2 }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
                {/* Cons */}
                <Typography variant="h6" sx={{ mt: 2 }}>Cons</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    placeholder="Add Con"
                    size="small"
                    value={conInput}
                    onChange={handleConInputChange}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConSubmit();
                      }
                    }}
                    fullWidth
                    InputProps={{
                      sx: {
                        background: darkMode ? '#23272f' : '#fff',
                        color: darkMode ? '#fff' : '#222',
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: darkMode ? '#b0b8c1' : '#555',
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkMode ? '#353a45' : '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: darkMode ? '#90caf9' : '#1976d2',
                        },
                      },
                    }}
                  />
                  <Button
                    onClick={handleConSubmit}
                    startIcon={<Add />}
                    sx={{
                      borderRadius: 1,
                      background: darkMode ? '#1976d2' : '#1976d2',
                      color: '#fff',
                      boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                      minWidth: 120,
                      fontWeight: 600,
                      '&:hover': {
                        background: darkMode ? '#1565c0' : '#1565c0',
                      },
                    }}
                  >
                    ADD
                  </Button>
                </Box>
                <List>
                  {currentDecision.cons.map((con, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: darkMode ? '#2d323b' : '#f5f6fa',
                        border: `1px solid ${darkMode ? '#444b58' : '#e3e6ee'}`,
                        borderRadius: 2,
                        mb: 1,
                        px: 2,
                        py: 1.5,
                        width: '100%',
                      }}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => removeItem('cons', index)} sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}>
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={<span style={{ fontWeight: 600, fontSize: 16 }}>{con.text}</span>}
                        secondary={null}
                      />
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: darkMode ? '#b0b8c1' : '#555' }}>
                          Weight: {con.weight}
                        </Typography>
                        <Slider
                          value={con.weight}
                          min={1}
                          max={10}
                          onChange={(_, val) => updateWeight('cons', index, val as number)}
                          size="small"
                          sx={{ color: darkMode ? '#90caf9' : '#1976d2', ml: 1, mr: 2 }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
                {/* Outcomes */}
                <Typography variant="h6" sx={{ mt: 2 }}>Potential Outcomes</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    placeholder="Add Outcome"
                    size="small"
                    value={outcomeInput}
                    onChange={handleOutcomeInputChange}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOutcomeSubmit();
                      }
                    }}
                    fullWidth
                    InputProps={{
                      sx: {
                        background: darkMode ? '#23272f' : '#fff',
                        color: darkMode ? '#fff' : '#222',
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: darkMode ? '#b0b8c1' : '#555',
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkMode ? '#353a45' : '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: darkMode ? '#90caf9' : '#1976d2',
                        },
                      },
                    }}
                  />
                  <Button
                    onClick={handleOutcomeSubmit}
                    startIcon={<Add />}
                    sx={{
                      borderRadius: 1,
                      background: darkMode ? '#1976d2' : '#1976d2',
                      color: '#fff',
                      boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                      minWidth: 120,
                      fontWeight: 600,
                      '&:hover': {
                        background: darkMode ? '#1565c0' : '#1565c0',
                      },
                    }}
                  >
                    ADD
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {currentDecision.outcomes.map((outcome, index) => (
                    <Chip
                      key={index}
                      label={outcome}
                      onDelete={() => removeItem('outcomes', index)}
                      sx={{
                        bgcolor: darkMode ? '#353a45' : '#e3e6ee',
                        color: darkMode ? '#fff' : '#222',
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      borderRadius: 1,
                      background: darkMode ? '#1976d2' : '#1976d2',
                      color: '#fff',
                      boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                      '&:hover': {
                        background: darkMode ? '#1565c0' : '#1565c0',
                      },
                    }}
                  >
                    SAVE DECISION
                  </Button>
                </Box>
              </form>
            </Paper>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {decisions.length === 0 ? (
              <Alert severity="info">No decisions recorded yet. Start by creating one!</Alert>
            ) : (
              <>
                {decisionList}
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    mt: 4,
                    borderRadius: 2,
                    background: darkMode ? '#23272f' : '#fff',
                    color: darkMode ? '#fff' : '#222',
                    boxShadow: darkMode ? '0 2px 8px #1118' : '0 2px 8px #ccc8',
                    border: `1px solid ${darkMode ? '#353a45' : '#e3e6ee'}`,
                  }}
                >
                  <Typography variant="h6" gutterBottom>Record Decision Outcome</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ width: '100%' }}>
                        <TextField
                          select
                          fullWidth
                          label="Select Decision"
                          value={selectedDecisionId}
                          onChange={(e) => handleDecisionSelect(e.target.value)}
                          margin="normal"
                          InputProps={{
                            sx: {
                              background: darkMode ? '#23272f' : '#fff',
                              color: darkMode ? '#fff' : '#222',
                            }
                          }}
                          InputLabelProps={{
                            sx: {
                              color: darkMode ? '#b0b8c1' : '#555',
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: darkMode ? '#353a45' : '#ccc',
                              },
                              '&:hover fieldset': {
                                borderColor: darkMode ? '#90caf9' : '#1976d2',
                              },
                            },
                          }}
                        >
                          {decisions.map((decision) => (
                            <MenuItem key={decision.id} value={decision.id}>
                              {decision.title}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Grid>
                    {selectedDecision && (
                      <Grid item xs={12}>
                        <TextField
                          select
                          fullWidth
                          label="Final Outcome"
                          value={finalOutcome}
                          onChange={(e) => handleFinalOutcomeChange(e.target.value)}
                          margin="normal"
                          InputProps={{
                            sx: {
                              background: darkMode ? '#23272f' : '#fff',
                              color: darkMode ? '#fff' : '#222',
                            }
                          }}
                          InputLabelProps={{
                            sx: {
                              color: darkMode ? '#b0b8c1' : '#555',
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: darkMode ? '#353a45' : '#ccc',
                              },
                              '&:hover fieldset': {
                                borderColor: darkMode ? '#90caf9' : '#1976d2',
                              },
                            },
                          }}
                        >
                          {selectedDecision.outcomes.map((outcome) => (
                            <MenuItem key={outcome} value={outcome}>
                              {outcome}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </>
            )}
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default DecisionJournal;