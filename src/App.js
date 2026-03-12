import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  Divider
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'

const THEME_DIC = {
  light: createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#4F46E5'
      },
      secondary: {
        main: '#7C3AED'
      }
    },
    typography: {
      fontFamily: 'system-ui'
    }
  }),
  dark: createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#818CF8'
      },
      secondary: {
        main: '#A78BFA'
      }
    },
    typography: {
      fontFamily: 'system-ui'
    }
  })
}

export default function App () {
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [items, setItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchText, setSearchText] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newString, setNewString] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // 加载数据
  const loadData = useCallback(() => {
    try {
      const data = window.services.searchStrings(searchText)
      setItems(data)
      setSelectedIndex(data.length > 0 ? 0 : -1)
    } catch (e) {
      console.error('加载数据失败:', e)
      showSnackbar('加载数据失败', 'error')
    }
  }, [searchText])

  // 初始化
  useEffect(() => {
    window.utools.onPluginEnter(({ code, type, payload, from }) => {
      if (code === 'main' || code === 'over') {
        // 设置子输入框
        window.utools.setSubInput(({ text }) => {
          setSearchText(text)
        }, '搜索字符串...', true)

        // 从入口动作中提取搜索词，并同步到状态与子输入框
        const initialText = (typeof payload === 'string' ? payload : '').trim()
        if (initialText) {
          setSearchText(initialText)
          window.utools.setSubInputValue(initialText)
          window.utools.subInputSelect()
        }
      } else if (code === 'import') {
        setImportDialogOpen(true)
      } else if (code === 'export') {
        handleExport()
      }
    })

    window.utools.onPluginOut(() => {
      // 清理资源
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      setTheme(e.matches ? 'dark' : 'light')
    })

    // 聚焦输入框
    inputRef.current?.focus()
  }, [])

  // 搜索变化时重新加载
  useEffect(() => {
    loadData()
  }, [searchText, loadData])

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (items.length === 0) {
      return
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIndex = Math.min(selectedIndex + 1, items.length - 1)
      setSelectedIndex(newIndex)
      scrollToIndex(newIndex)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIndex = Math.max(selectedIndex - 1, 0)
      setSelectedIndex(newIndex)
      scrollToIndex(newIndex)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleCopy(items[selectedIndex])
      }
    }
  }

  const scrollToIndex = (index) => {
    if (listRef.current) {
      const listItems = listRef.current.children
      if (listItems[index]) {
        listItems[index].scrollIntoView({ block: 'nearest' })
      }
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCopy = (text) => {
    try {
      window.utools.copyText(text)
      showSnackbar('已复制到剪贴板')
      // 复制成功后退出插件并自动粘贴
      setTimeout(() => {
        utools.hideMainWindow();
        window.utools.outPlugin()
        setTimeout(() => {
          // 根据平台使用不同的粘贴快捷键
          const isMacOS = window.utools.isMacOS()
          if (isMacOS) {
            window.utools.simulateKeyboardTap('v', 'command')
          } else {
            window.utools.simulateKeyboardTap('v', 'ctrl')
          }
        }, 50)
      }, 100)
    } catch (e) {
      showSnackbar('复制失败', 'error')
    }
  }

  const handleDelete = (text) => {
    try {
      const success = window.services.removeString(text)
      if (success) {
        showSnackbar('删除成功')
        loadData()
      }
    } catch (e) {
      showSnackbar('删除失败', 'error')
    }
  }

  const handleAdd = () => {
    if (!newString.trim()) {
      showSnackbar('请输入字符串', 'warning')
      return
    }
    try {
      const success = window.services.addString(newString)
      if (success) {
        showSnackbar('添加成功')
        setNewString('')
        setAddDialogOpen(false)
        loadData()
      } else {
        showSnackbar('字符串已存在', 'warning')
      }
    } catch (e) {
      showSnackbar('添加失败', 'error')
    }
  }

  const handleImport = () => {
    if (!importText.trim()) {
      showSnackbar('请输入 JSON 数组', 'warning')
      return
    }
    try {
      const result = window.services.importStrings(importText)
      if (result.success) {
        showSnackbar(`成功导入 ${result.count} 条数据`)
        setImportText('')
        setImportDialogOpen(false)
        loadData()
      } else {
        showSnackbar(result.message, 'error')
      }
    } catch (e) {
      showSnackbar('导入失败', 'error')
    }
  }

  const handleExport = () => {
    try {
      const jsonStr = window.services.exportStrings()
      // 复制到剪贴板
      window.utools.copyText(jsonStr)
      showSnackbar('已复制 JSON 到剪贴板')
    } catch (e) {
      showSnackbar('导出失败', 'error')
    }
  }

  const handleImportFile = () => {
    try {
      const files = window.utools.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      })
      if (files && files.length > 0) {
        const result = window.services.importFromFile(files[0])
        if (result.success) {
          showSnackbar(`成功导入 ${result.count} 条数据`)
          loadData()
        } else {
          showSnackbar(result.message, 'error')
        }
      }
    } catch (e) {
      showSnackbar('读取文件失败', 'error')
    }
  }

  return (
    <ThemeProvider theme={THEME_DIC[theme]}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: 1 }}>
        {/* 搜索框和操作按钮 */}
        <Paper sx={{ p: 1, mb: 1 }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              ref={inputRef}
              fullWidth
              size="small"
              placeholder="搜索字符串..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <Tooltip title="添加">
              <IconButton color="primary" onClick={() => setAddDialogOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="导入">
              <IconButton onClick={() => setImportDialogOpen(true)}>
                <FileUploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="导出">
              <IconButton onClick={handleExport}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        <Divider sx={{ my: 1 }} />

        {/* 字符串列表 */}
        <Paper sx={{ flex: 1, overflow: 'auto' }} elevation={1} tabIndex={0} onKeyDown={handleKeyDown}>
          {items.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
              <Typography>暂无数据，请添加或导入字符串</Typography>
            </Box>
          ) : (
            <List ref={listRef} dense>
              {items.map((item, index) => (
                <ListItem
                  key={index}
                  selected={index === selectedIndex}
                  onClick={() => handleCopy(item)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    },
                    ...(index === selectedIndex && {
                      bgcolor: theme === 'dark' ? '#4F46E5' : '#C7D0EB',
                      borderLeft: theme === 'dark' ? '4px solid #818CF8' : '4px solid #4F46E5',
                      '&:hover': {
                        bgcolor: theme === 'dark' ? '#6366F1' : '#A5B4F5'
                      }
                    })
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="复制">
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(item)
                          }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item)
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={item}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pr: 8
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* 底部提示 */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            共 {items.length} 条 | ↑↓ 选择 | Enter 复制
          </Typography>
        </Box>
      </Box>

      {/* 添加对话框 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加字符串</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder="请输入字符串..."
            value={newString}
            onChange={(e) => setNewString(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
          <Button onClick={handleAdd} variant="contained">添加</Button>
        </DialogActions>
      </Dialog>

      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>导入 JSON 数组</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            请输入 JSON 数组格式的字符串，例如：["字符串1", "字符串2", "字符串3"]
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder='["字符串1", "字符串2"]'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportFile}>从文件导入</Button>
          <Button onClick={() => setImportDialogOpen(false)}>取消</Button>
          <Button onClick={handleImport} variant="contained">导入</Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}
