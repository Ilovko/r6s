"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Target,
  ArrowRight,
  Eraser,
  RotateCcw,
  Save,
  Upload,
  Move,
  Crosshair,
  Shield,
  Zap,
  Heart,
  MicroscopeIcon as Scope,
  X,
  Square,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Hand,
  Layers,
  ChevronDown,
  ChevronRight,
  Keyboard,
  Undo,
  Redo,
  Building,
  ArrowUp,
  ArrowDown,
  Globe,
  Sun,
  Moon,
  FolderOpen,
  Trash2,
  Download,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Position {
  x: number
  y: number
}

interface Player {
  id: string
  position: Position
  team: "attack" | "defense"
  type: PlayerType
  label: string
  floor: FloorType
}

interface Arrow {
  id: string
  start: Position
  end: Position
  color: string
  floor: FloorType
}

interface TacticalMarker {
  id: string
  position: Position
  type: MarkerType
  floor: FloorType
}

interface Wall {
  id: string
  start: Position
  end: Position
  floor: FloorType
}

interface LayerState {
  visible: boolean
  locked: boolean
}

interface CollapsibleState {
  map: boolean
  floors: boolean
  layers: boolean
  playerPlacement: boolean
  basicTools: boolean
  tacticalMarkers: boolean
  mapControls: boolean
  actions: boolean
}

interface SavedStrategy {
  id: string
  name: string
  map: MapType
  floor: FloorType
  createdAt: string
  players: Player[]
  arrows: Arrow[]
  markers: TacticalMarker[]
  walls: Wall[]
  zoom: number
  pan: Position
  layers: Record<LayerType, LayerState>
  language: Language
  theme: Theme
}

type PlayerType =
  | "Ash" | "Iana" | "Zofia" | "Sledge" | "Nøkk" // entry
  | "Thermite" | "Hibana" | "Ace" | "Maverick" // hardBreacher
  | "Thatcher" | "Zero" | "Lion" | "Dokkaebi" | "Gridlock" // support
  | "Smoke" | "Echo" | "Maestro" | "Warden" | "Goyo" // anchor
  | "Jäger" | "Valkyrie" | "Caveira" | "Vigil" | "Alibi" // roamer
type MarkerType = "danger" | "watch" | "objective"
type Tool = "player" | "blueArrow" | "redArrow" | "move" | "erase" | "pan" | "wall" | "danger" | "watch" | "objective"
type MapType = "dust2" | "mirage" | "inferno" | "cache" | "overpass"
type LayerType = "players" | "arrows" | "markers" | "walls"
type FloorType = "ground" | "upper" | "lower" | "basement"
type Language = "ko" | "en" | "ja"
type Theme = "light" | "dark"

interface PlayerTypeInfo {
  name: { ko: string; en: string; ja: string }
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface MarkerTypeInfo {
  name: { ko: string; en: string; ja: string }
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface LayerInfo {
  name: { ko: string; en: string; ja: string }
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface FloorInfo {
  name: { ko: string; en: string; ja: string }
  icon: React.ComponentType<{ className?: string }>
  color: string
  shortcut: string
}

interface HistoryState {
  players: Player[]
  arrows: Arrow[]
  markers: TacticalMarker[]
  walls: Wall[]
}

interface Translations {
  ko: Record<string, string>
  en: Record<string, string>
  ja: Record<string, string>
}

interface ThemeColors {
  light: {
    background: string
    cardBackground: string
    textPrimary: string
    textSecondary: string
    border: string
    navBackground: string
  }
  dark: {
    background: string
    cardBackground: string
    textPrimary: string
    textSecondary: string
    border: string
    navBackground: string
  }
}

const THEME_COLORS: ThemeColors = {
  light: {
    background: "#f9fafb",
    cardBackground: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    navBackground: "#ffffff",
  },
  dark: {
    background: "#111827",
    cardBackground: "#1f2937",
    textPrimary: "#f9fafb",
    textSecondary: "#9ca3af",
    border: "#374151",
    navBackground: "#1f2937",
  },
}

const TRANSLATIONS: Translations = {
  ko: {
    title: "FPS 전략 플래너",
    mapSelection: "맵 선택",
    floorSelection: "층 선택",
    layerManagement: "레이어 관리",
    playerPlacement: "플레이어 배치",
    basicTools: "기본 도구",
    tacticalMarkers: "전술 마커",
    mapControls: "맵 컨트롤",
    actions: "액션",
    teamSelection: "팀 선택",
    roleSelection: "역할 선택",
    attack: "공격",
    defense: "수비",
    blueArrow: "파란화살표",
    redArrow: "빨간화살표",
    move: "이동",
    erase: "지우기",
    mapPan: "맵이동",
    wall: "벽",
    dangerZone: "위험",
    watchPoint: "감시",
    objective: "목표",
    undo: "실행 취소",
    redo: "되돌리기",
    reset: "전체 초기화",
    save: "저장",
    load: "불러오기",
    export: "파일로 내보내기",
    import: "파일에서 가져오기",
    zoom: "줌",
    currentFloor: "현재 층",
    players: "플레이어",
    arrows: "화살표",
    markers: "마커",
    walls: "벽",
    placePlayer: "배치",
    keyboardShortcuts: "키보드 단축키",
    basicToolsShortcuts: "기본 도구",
    tacticalMarkersShortcuts: "전술 마커",
    floorChangeShortcuts: "층 변경",
    otherShortcuts: "기타",
    mapChangeWarning: "맵 변경 확인",
    mapChangeDescription:
      "맵을 변경하면 현재 작업 중인 모든 내용(플레이어, 화살표, 마커, 벽)이 삭제됩니다. 계속하시겠습니까?",
    cancel: "취소",
    confirm: "확인",
    playerRoleChange: "플레이어 역할 변경",
    usage: "사용법",
    usageHelp: "키보드 단축키 도움말",
    usageFloorChange: "층 변경 (맵에 따라 다름)",
    usageLayer: "레이어: 눈 아이콘으로 표시/숨김",
    usageLock: "자물쇠: 레이어 잠금/해제",
    usageMapChange: "맵 변경 시 자동 초기화",
    usageFloorSeparation: "층별로 요소가 분리되어 관리됨",
    placementPreview: "배치 예정",
    language: "언어",
    theme: "테마",
    lightTheme: "라이트",
    darkTheme: "다크",
    saveStrategy: "저장",
    loadStrategy: "불러오기",
    strategyName: "전략 이름",
    enterStrategyName: "전략 이름을 입력하세요",
    savedStrategies: "저장된 전략",
    noSavedStrategies: "저장된 전략이 없습니다",
    deleteStrategy: "전략 삭제",
    deleteStrategyConfirm: "이 전략을 삭제하시겠습니까?",
    createdAt: "생성일",
    loadSelected: "선택한 전략 불러오기",
    deleteSelected: "선택한 전략 삭제",
  },
  en: {
    title: "FPS Strategy Planner",
    mapSelection: "Map Selection",
    floorSelection: "Floor Selection",
    layerManagement: "Layer Management",
    playerPlacement: "Player Placement",
    basicTools: "Basic Tools",
    tacticalMarkers: "Tactical Markers",
    mapControls: "Map Controls",
    actions: "Actions",
    teamSelection: "Team Selection",
    roleSelection: "Role Selection",
    attack: "Attack",
    defense: "Defense",
    blueArrow: "Blue Arrow",
    redArrow: "Red Arrow",
    move: "Move",
    erase: "Erase",
    mapPan: "Pan Map",
    wall: "Wall",
    dangerZone: "Danger",
    watchPoint: "Watch",
    objective: "Objective",
    undo: "Undo",
    redo: "Redo",
    reset: "Reset All",
    save: "Save",
    load: "Load",
    export: "Export to File",
    import: "Import from File",
    zoom: "Zoom",
    currentFloor: "Current Floor",
    players: "Players",
    arrows: "Arrows",
    markers: "Markers",
    walls: "Walls",
    placePlayer: "Place",
    keyboardShortcuts: "Keyboard Shortcuts",
    basicToolsShortcuts: "Basic Tools",
    tacticalMarkersShortcuts: "Tactical Markers",
    floorChangeShortcuts: "Floor Change",
    otherShortcuts: "Others",
    mapChangeWarning: "Map Change Confirmation",
    mapChangeDescription:
      "Changing the map will delete all current work (players, arrows, markers, walls). Do you want to continue?",
    cancel: "Cancel",
    confirm: "Confirm",
    playerRoleChange: "Change Player Role",
    usage: "Usage",
    usageHelp: "Keyboard shortcuts help",
    usageFloorChange: "Floor change (varies by map)",
    usageLayer: "Layer: Show/hide with eye icon",
    usageLock: "Lock/unlock layers",
    usageMapChange: "Auto reset when changing maps",
    usageFloorSeparation: "Elements are managed separately by floor",
    placementPreview: "To be placed",
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    saveStrategy: "Save",
    loadStrategy: "Load",
    strategyName: "Strategy Name",
    enterStrategyName: "Enter strategy name",
    savedStrategies: "Saved Strategies",
    noSavedStrategies: "No saved strategies",
    deleteStrategy: "Delete Strategy",
    deleteStrategyConfirm: "Are you sure you want to delete this strategy?",
    createdAt: "Created",
    loadSelected: "Load Selected Strategy",
    deleteSelected: "Delete Selected Strategy",
  },
  ja: {
    title: "FPS戦略プランナー",
    mapSelection: "マップ選択",
    floorSelection: "フロア選択",
    layerManagement: "レイヤー管理",
    playerPlacement: "プレイヤー配置",
    basicTools: "基本ツール",
    tacticalMarkers: "戦術マーカー",
    mapControls: "マップコントロール",
    actions: "アクション",
    teamSelection: "チーム選択",
    roleSelection: "役割選択",
    attack: "攻撃",
    defense: "守備",
    blueArrow: "青い矢印",
    redArrow: "赤い矢印",
    move: "移動",
    erase: "消去",
    mapPan: "マップ移動",
    wall: "壁",
    dangerZone: "危険",
    watchPoint: "監視",
    objective: "目標",
    undo: "元に戻す",
    redo: "やり直し",
    reset: "全てリセット",
    save: "保存",
    load: "読み込み",
    export: "ファイルにエクスポート",
    import: "ファイルからインポート",
    zoom: "ズーム",
    currentFloor: "現在のフロア",
    players: "プレイヤー",
    arrows: "矢印",
    markers: "マーカー",
    walls: "壁",
    placePlayer: "配置",
    keyboardShortcuts: "キーボードショートカット",
    basicToolsShortcuts: "基本ツール",
    tacticalMarkersShortcuts: "戦術マーカー",
    floorChangeShortcuts: "フロア変更",
    otherShortcuts: "その他",
    mapChangeWarning: "マップ変更確認",
    mapChangeDescription:
      "マップを変更すると、現在の作業内容（プレイヤー、矢印、マーカー、壁）がすべて削除されます。続行しますか？",
    cancel: "キャンセル",
    confirm: "確認",
    playerRoleChange: "プレイヤー役割変更",
    usage: "使用方法",
    usageHelp: "キーボードショートカットヘルプ",
    usageFloorChange: "フロア変更（マップによって異なる）",
    usageLayer: "レイヤー：目のアイコンで表示/非表示",
    usageLock: "ロック/アンロック",
    usageMapChange: "マップ変更時に自動リセット",
    usageFloorSeparation: "要素はフロア別に管理されます",
    placementPreview: "配置予定",
    language: "言語",
    theme: "テーマ",
    lightTheme: "ライト",
    darkTheme: "ダーク",
    saveStrategy: "保存",
    loadStrategy: "読み込み",
    strategyName: "戦略名",
    enterStrategyName: "戦略名を入力してください",
    savedStrategies: "保存された戦略",
    noSavedStrategies: "保存された戦略がありません",
    deleteStrategy: "戦略削除",
    deleteStrategyConfirm: "この戦略を削除しますか？",
    createdAt: "作成日",
    loadSelected: "選択した戦略を読み込み",
    deleteSelected: "選択した戦略を削除",
  },
}

const OPERATOR_ROLES = {
  attack: {
    entry: ["Ash", "Iana", "Zofia", "Sledge", "Nøkk"],
    hardBreacher: ["Thermite", "Hibana", "Ace", "Maverick"],
    support: ["Thatcher", "Zero", "Lion", "Dokkaebi", "Gridlock"],
  },
  defense: {
    anchor: ["Smoke", "Echo", "Maestro", "Warden", "Goyo"],
    roamer: ["Jäger", "Valkyrie", "Caveira", "Vigil", "Alibi"],
  },
} as const

// 역할별 기본 설정 추가
const ROLE_DEFAULTS = {
  attack: {
    entry: {
      color: "#f59e0b",
      labelPrefix: "T",
      icon: Crosshair,
    },
    hardBreacher: {
      color: "#10b981",
      labelPrefix: "T",
      icon: Shield,
    },
    support: {
      color: "#8b5cf6",
      labelPrefix: "T",
      icon: Zap,
    },
  },
  defense: {
    anchor: {
      color: "#ec4899",
      labelPrefix: "CT",
      icon: Heart,
    },
    roamer: {
      color: "#ef4444",
      labelPrefix: "CT",
      icon: Move,
    },
  },
}

// 오퍼레이터 아이콘 컴포넌트 (이미지 URL 기반)
const OperatorIcon: React.FC<{ url: string; className?: string }> = ({ url, className }) => (
  <img src={url} alt="operator" className={className} style={{ width: "20%", height: "20%" }} />
)

// 오퍼레이터별 이미지 URL 매핑
const OPERATOR_IMAGE_URLS: Record<PlayerType, string> = {
  Ash: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208302/ash_q5cfwn.png",
  Iana: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208308/iana_pnfmdz.png",
  Zofia: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208318/zofia_ih1qee.png",
  Sledge: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208312/sledge_qrchx0.png",
  Nøkk: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208309/nokk_y1moem.png",
  Thermite: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208316/thermite_wjcbkl.png",
  Hibana: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208308/hibana_imhria.png",
  Ace: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208302/ace_xse46c.png",
  Maverick: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208308/maverick_yt9ckk.png",
  Thatcher: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208316/thatcher_kkzylx.png",
  Zero: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208317/zero_guumn2.png",
  Lion: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208309/lion_mrzhrd.png",
  Dokkaebi: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208303/dokkaebi_fmk5fg.png",
  Gridlock: "https://res.cloudinary.com/dpr8t4ijf/image/upload/v1752208304/gridlock_swl7cq.png",
  Smoke: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Smoke_icon.png",
  Echo: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Echo_icon.png",
  Maestro: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Maestro_icon.png",
  Warden: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Warden_icon.png",
  Goyo: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Goyo_icon.png",
  Jäger: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Jager_icon.png",
  Valkyrie: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Valkyrie_icon.png",
  Caveira: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Caveira_icon.png",
  Vigil: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Vigil_icon.png",
  Alibi: "https://static.wikia.nocookie.net/rainbowsix/images/2/2c/Alibi_icon.png",
}


// 오퍼레이터 정보
const PLAYER_TYPES: Record<PlayerType, PlayerTypeInfo> = Object.fromEntries(
  Object.entries(OPERATOR_IMAGE_URLS).map(([key, url]) => [
    key,
    {
      name: { ko: key, en: key, ja: key },
      icon: (props: { className?: string }) => <OperatorIcon url={url} className={props.className} />,
      color:
        key === "Ash" || key === "Iana" || key === "Zofia" || key === "Sledge" || key === "Nøkk"
          ? "#f59e0b"
          : key === "Thermite" || key === "Hibana" || key === "Ace" || key === "Maverick"
          ? "#10b981"
          : key === "Thatcher" || key === "Zero" || key === "Lion" || key === "Dokkaebi" || key === "Gridlock"
          ? "#8b5cf6"
          : key === "Smoke" || key === "Echo" || key === "Maestro" || key === "Warden" || key === "Goyo"
          ? "#ec4899"
          : "#ef4444",
    },
  ])
) as Record<PlayerType, PlayerTypeInfo>

const MARKER_TYPES: Record<MarkerType, MarkerTypeInfo> = {
  danger: {
    name: { ko: "위험 지역", en: "Danger Zone", ja: "危険エリア" },
    icon: X,
    color: "#dc2626",
  },
  watch: {
    name: { ko: "감시 지점", en: "Watch Point", ja: "監視ポイント" },
    icon: Eye,
    color: "#059669",
  },
  objective: {
    name: { ko: "목표 지점", en: "Objective", ja: "目標ポイント" },
    icon: AlertTriangle,
    color: "#d97706",
  },
}

const LAYER_INFO: Record<LayerType, LayerInfo> = {
  players: {
    name: { ko: "플레이어", en: "Players", ja: "プレイヤー" },
    icon: Users,
    color: "#3b82f6",
  },
  arrows: {
    name: { ko: "화살표", en: "Arrows", ja: "矢印" },
    icon: ArrowRight,
    color: "#10b981",
  },
  markers: {
    name: { ko: "마커", en: "Markers", ja: "マーカー" },
    icon: Target,
    color: "#f59e0b",
  },
  walls: {
    name: { ko: "벽", en: "Walls", ja: "壁" },
    icon: Square,
    color: "#6b7280",
  },
}

const FLOOR_INFO: Record<FloorType, FloorInfo> = {
  ground: {
    name: { ko: "1층 (지상)", en: "Ground Floor", ja: "1階（地上）" },
    icon: Building,
    color: "#10b981",
    shortcut: "Shift+1",
  },
  upper: {
    name: { ko: "2층 (상층)", en: "Upper Floor", ja: "2階（上層）" },
    icon: ArrowUp,
    color: "#3b82f6",
    shortcut: "Shift+2",
  },
  lower: {
    name: { ko: "지하 1층", en: "Lower Floor", ja: "地下1階" },
    icon: ArrowDown,
    color: "#f59e0b",
    shortcut: "Shift+3",
  },
  basement: {
    name: { ko: "지하 2층", en: "Basement", ja: "地下2階" },
    icon: ArrowDown,
    color: "#ef4444",
    shortcut: "Shift+4",
  },
}

const MAPS: Record<MapType, { name: string; background: { light: string; dark: string }; floors: FloorType[] }> = {
  dust2: { name: "Dust2", background: { light: "#d4a574", dark: "#8b6914" }, floors: ["ground", "upper"] },
  mirage: { name: "Mirage", background: { light: "#c4b5a0", dark: "#78716c" }, floors: ["ground", "upper", "lower"] },
  inferno: { name: "Inferno", background: { light: "#8b7355", dark: "#57534e" }, floors: ["ground", "upper"] },
  cache: { name: "Cache", background: { light: "#a8a8a8", dark: "#525252" }, floors: ["ground", "lower"] },
  overpass: {
    name: "Overpass",
    background: { light: "#7fb069", dark: "#365314" },
    floors: ["ground", "upper", "lower", "basement"],
  },
}

const KEYBOARD_SHORTCUTS = {
  "1": "blueArrow",
  "2": "redArrow",
  "3": "move",
  "4": "erase",
  "5": "pan",
  q: "wall",
  w: "danger",
  e: "watch",
  r: "objective",
  Delete: "erase",
  Backspace: "erase",
}

// 기기 설정 감지 함수들
const getSystemLanguage = (): Language => {
  if (typeof window === "undefined") return "ko"
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith("ko")) return "ko"
  if (lang.startsWith("ja")) return "ja"
  return "en"
}

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// 로컬 스토리지 관리 함수들
const STORAGE_KEY = "fps-strategy-planner-saves"

const getSavedStrategies = (): SavedStrategy[] => {
  if (typeof window === "undefined") return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error("Failed to load saved strategies:", error)
    return []
  }
}

const saveStrategyToStorage = (strategy: SavedStrategy): void => {
  if (typeof window === "undefined") return
  try {
    const strategies = getSavedStrategies()
    const existingIndex = strategies.findIndex((s) => s.id === strategy.id)

    if (existingIndex >= 0) {
      strategies[existingIndex] = strategy
    } else {
      strategies.push(strategy)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies))
  } catch (error) {
    console.error("Failed to save strategy:", error)
  }
}

const deleteStrategyFromStorage = (strategyId: string): void => {
  if (typeof window === "undefined") return
  try {
    const strategies = getSavedStrategies()
    const filtered = strategies.filter((s) => s.id !== strategyId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Failed to delete strategy:", error)
  }
}

export default function Component() {
  const [players, setPlayers] = useState<Player[]>([])
  const [arrows, setArrows] = useState<Arrow[]>([])
  const [markers, setMarkers] = useState<TacticalMarker[]>([])
  const [walls, setWalls] = useState<Wall[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool>("player")
  const [selectedPlayerType, setSelectedPlayerType] = useState<PlayerType>("Ash")
  const [selectedTeam, setSelectedTeam] = useState<"attack" | "defense">("attack")
  const [selectedMap, setSelectedMap] = useState<MapType>("dust2")
  const [selectedFloor, setSelectedFloor] = useState<FloorType>("ground")
  const [language, setLanguage] = useState<Language>("ko")
  const [theme, setTheme] = useState<Theme>("light")
  const [isDrawingArrow, setIsDrawingArrow] = useState(false)
  const [isDrawingWall, setIsDrawingWall] = useState(false)
  const [arrowStart, setArrowStart] = useState<Position | null>(null)
  const [wallStart, setWallStart] = useState<Position | null>(null)
  const [currentArrowEnd, setCurrentArrowEnd] = useState<Position | null>(null)
  const [currentWallEnd, setCurrentWallEnd] = useState<Position | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null)
  const [draggedMarker, setDraggedMarker] = useState<string | null>(null)
  const [draggedWall, setDraggedWall] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; playerId: string | null }>({
    open: false,
    playerId: null,
  })
  const [shortcutsDialog, setShortcutsDialog] = useState(false)

  // 저장/불러오기 다이얼로그 상태
  const [saveDialog, setSaveDialog] = useState<{ open: boolean; strategyName: string }>({
    open: false,
    strategyName: "",
  })
  const [loadDialog, setLoadDialog] = useState<{ open: boolean; selectedStrategy: string | null }>({
    open: false,
    selectedStrategy: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; strategyId: string | null }>({
    open: false,
    strategyId: null,
  })

  // 히스토리 관리
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const [mapChangeDialog, setMapChangeDialog] = useState<{ open: boolean; newMap: MapType | null }>({
    open: false,
    newMap: null,
  })

  // 레이어 상태 관리
  const [layers, setLayers] = useState<Record<LayerType, LayerState>>({
    players: { visible: true, locked: false },
    arrows: { visible: true, locked: false },
    markers: { visible: true, locked: false },
    walls: { visible: true, locked: false },
  })

  // 접기/펼치기 상태 관리
  const [collapsibleState, setCollapsibleState] = useState<CollapsibleState>({
    map: true,
    floors: true,
    layers: true,
    playerPlacement: true,
    basicTools: true,
    tacticalMarkers: true,
    mapControls: true,
    actions: true,
  })

  // 줌/팬 상태
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 })

  const svgRef = useRef<SVGSVGElement>(null)

  // 기기 설정에 따른 초기값 설정
  useEffect(() => {
    setLanguage(getSystemLanguage())
    setTheme(getSystemTheme())
  }, [])

  // 번역 함수
  const t = useCallback(
    (key: string) => {
      return TRANSLATIONS[language][key] || key
    },
    [language],
  )

  // 현재 테마 색상
  const currentColors = THEME_COLORS[theme]

  // 현재 맵에서 사용 가능한 층들
  const availableFloors = MAPS[selectedMap].floors

  // 저장된 전략 목록
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([])

  // 저장된 전략 목록 새로고침
  const refreshSavedStrategies = useCallback(() => {
    setSavedStrategies(getSavedStrategies())
  }, [])

  // 컴포넌트 마운트 시 저장된 전략 로드
  useEffect(() => {
    refreshSavedStrategies()
  }, [refreshSavedStrategies])

  // 히스토리에 현재 상태 저장
  const saveToHistory = useCallback(() => {
    const currentState: HistoryState = { players, arrows, markers, walls }
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(currentState)
      return newHistory.slice(-50) // 최대 50개 히스토리 유지
    })
    setHistoryIndex((prev) => Math.min(prev + 1, 49))
  }, [players, arrows, markers, walls, historyIndex])

  // 실행 취소
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setPlayers(prevState.players)
      setArrows(prevState.arrows)
      setMarkers(prevState.markers)
      setWalls(prevState.walls)
      setHistoryIndex((prev) => prev - 1)
    }
  }, [history, historyIndex])

  // 되돌리기
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setPlayers(nextState.players)
      setArrows(nextState.arrows)
      setMarkers(nextState.markers)
      setWalls(nextState.walls)
      setHistoryIndex((prev) => prev + 1)
    }
  }, [history, historyIndex])

  // ---------- util callbacks ----------
  const clearAll = useCallback(() => {
    setPlayers([])
    setArrows([])
    setMarkers([])
    setWalls([])
    setIsDrawingArrow(false)
    setIsDrawingWall(false)
    setArrowStart(null)
    setWallStart(null)
    setCurrentArrowEnd(null)
    setCurrentWallEnd(null)
    saveToHistory()
  }, [saveToHistory])

  // 층 변경 처리
  const handleFloorChange = useCallback(
    (newFloor: FloorType) => {
      if (availableFloors.includes(newFloor)) {
        setSelectedFloor(newFloor)
      }
    },
    [availableFloors],
  )

  // 저장 처리
  const handleSave = useCallback(() => {
    const defaultName = `${MAPS[selectedMap].name}-${FLOOR_INFO[selectedFloor].name[language]}-${new Date().toLocaleDateString()}`
    setSaveDialog({ open: true, strategyName: defaultName })
  }, [selectedMap, selectedFloor, language])

  const confirmSave = useCallback(() => {
    if (!saveDialog.strategyName.trim()) return

    const strategy: SavedStrategy = {
      id: Date.now().toString(),
      name: saveDialog.strategyName.trim(),
      map: selectedMap,
      floor: selectedFloor,
      createdAt: new Date().toISOString(),
      players,
      arrows,
      markers,
      walls,
      zoom,
      pan,
      layers,
      language,
      theme,
    }

    saveStrategyToStorage(strategy)
    refreshSavedStrategies()
    setSaveDialog({ open: false, strategyName: "" })
  }, [
    saveDialog.strategyName,
    selectedMap,
    selectedFloor,
    players,
    arrows,
    markers,
    walls,
    zoom,
    pan,
    layers,
    language,
    theme,
    refreshSavedStrategies,
  ])

  // 불러오기 처리
  const handleLoad = useCallback(() => {
    setLoadDialog({ open: true, selectedStrategy: null })
  }, [])

  const confirmLoad = useCallback(() => {
    if (!loadDialog.selectedStrategy) return

    const strategy = savedStrategies.find((s) => s.id === loadDialog.selectedStrategy)
    if (!strategy) return

    setPlayers(strategy.players)
    setArrows(strategy.arrows)
    setMarkers(strategy.markers)
    setWalls(strategy.walls)
    setSelectedMap(strategy.map)
    setSelectedFloor(strategy.floor)
    setZoom(strategy.zoom)
    setPan(strategy.pan)
    setLayers(strategy.layers)
    setLanguage(strategy.language)
    setTheme(strategy.theme)

    setLoadDialog({ open: false, selectedStrategy: null })
    saveToHistory()
  }, [loadDialog.selectedStrategy, savedStrategies, saveToHistory])

  // 삭제 처리
  const handleDelete = useCallback((strategyId: string) => {
    setDeleteDialog({ open: true, strategyId })
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteDialog.strategyId) return

    deleteStrategyFromStorage(deleteDialog.strategyId)
    refreshSavedStrategies()
    setDeleteDialog({ open: false, strategyId: null })
  }, [deleteDialog.strategyId, refreshSavedStrategies])

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl+S: 저장
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault()
        handleSave()
        return
      }

      // Ctrl+O: 불러오기
      if (event.ctrlKey && event.key === "o") {
        event.preventDefault()
        handleLoad()
        return
      }

      // Ctrl+Z: 실행 취소
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault()
        undo()
        return
      }

      // Ctrl+Y: 되돌리기
      if (event.ctrlKey && event.key === "y") {
        event.preventDefault()
        redo()
        return
      }

      // F1: 단축키 도움말
      if (event.key === "F1" && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        setShortcutsDialog(true)
        return
      }

      // 층 변경 단축키 (Shift+1-4)
      if (event.shiftKey && event.key === "1") {
        event.preventDefault()
        handleFloorChange("ground")
        return
      }
      if (event.shiftKey && event.key === "2") {
        event.preventDefault()
        handleFloorChange("upper")
        return
      }
      if (event.shiftKey && event.key === "3") {
        event.preventDefault()
        handleFloorChange("lower")
        return
      }
      if (event.shiftKey && event.key === "4") {
        event.preventDefault()
        handleFloorChange("basement")
        return
      }

      // 도구 선택 단축키
      const tool = KEYBOARD_SHORTCUTS[event.key as keyof typeof KEYBOARD_SHORTCUTS]
      if (tool) {
        event.preventDefault()
        setSelectedTool(tool as Tool)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo, handleFloorChange, handleSave, handleLoad])

  // 맵 변경 처리
  const handleMapChangeRequest = useCallback(
    (newMap: MapType) => {
      const hasContent = players.length > 0 || arrows.length > 0 || markers.length > 0 || walls.length > 0

      if (hasContent) {
        setMapChangeDialog({ open: true, newMap })
      } else {
        setSelectedMap(newMap)
        // 새 맵의 첫 번째 층으로 설정
        setSelectedFloor(MAPS[newMap].floors[0])
      }
    },
    [players, arrows, markers, walls],
  )

  const confirmMapChange = useCallback(() => {
    if (mapChangeDialog.newMap) {
      setSelectedMap(mapChangeDialog.newMap)
      setSelectedFloor(MAPS[mapChangeDialog.newMap].floors[0])
      clearAll()
    }
    setMapChangeDialog({ open: false, newMap: null })
  }, [mapChangeDialog.newMap, clearAll])

  const toggleCollapsible = useCallback((section: keyof CollapsibleState) => {
    setCollapsibleState((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  const toggleLayerVisibility = useCallback((layerType: LayerType) => {
    setLayers((prev) => ({
      ...prev,
      [layerType]: { ...prev[layerType], visible: !prev[layerType].visible },
    }))
  }, [])

  const toggleLayerLock = useCallback((layerType: LayerType) => {
    setLayers((prev) => ({
      ...prev,
      [layerType]: { ...prev[layerType], locked: !prev[layerType].locked },
    }))
  }, [])

  const isLayerInteractable = useCallback(
    (layerType: LayerType) => {
      return layers[layerType].visible && !layers[layerType].locked
    },
    [layers],
  )

  const getMousePosition = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return { x: 0, y: 0 }
      const rect = svgRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - pan.x) / zoom
      const y = (event.clientY - rect.top - pan.y) / zoom
      return { x, y }
    },
    [zoom, pan],
  )

  const handleSVGMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const position = getMousePosition(event)

      if (selectedTool === "pan") {
        setIsPanning(true)
        setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y })
        return
      }

      if (selectedTool === "player" && isLayerInteractable("players")) {
        const newPlayer: Player = {
          id: `${selectedTeam}-${Date.now()}`,
          position,
          team: selectedTeam,
          type: selectedPlayerType,
          label:
            selectedTeam === "attack"
              ? `T${players.filter((p) => p.team === "attack" && p.floor === selectedFloor).length + 1}`
              : `CT${players.filter((p) => p.team === "defense" && p.floor === selectedFloor).length + 1}`,
          floor: selectedFloor,
        }
        setPlayers((prev) => [...prev, newPlayer])
        saveToHistory()
      } else if ((selectedTool === "blueArrow" || selectedTool === "redArrow") && isLayerInteractable("arrows")) {
        setArrowStart(position)
        setCurrentArrowEnd(position)
        setIsDrawingArrow(true)
      } else if (selectedTool === "wall" && isLayerInteractable("walls")) {
        setWallStart(position)
        setCurrentWallEnd(position)
        setIsDrawingWall(true)
      } else if (["danger", "watch", "objective"].includes(selectedTool) && isLayerInteractable("markers")) {
        const newMarker: TacticalMarker = {
          id: `marker-${Date.now()}`,
          position,
          type: selectedTool as MarkerType,
          floor: selectedFloor,
        }
        setMarkers((prev) => [...prev, newMarker])
        saveToHistory()
      }
    },
    [
      selectedTool,
      selectedPlayerType,
      players,
      pan,
      getMousePosition,
      isLayerInteractable,
      saveToHistory,
      selectedTeam,
      selectedFloor,
    ],
  )

  const handleSVGMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning && selectedTool === "pan") {
        setPan({
          x: event.clientX - panStart.x,
          y: event.clientY - panStart.y,
        })
        return
      }

      const position = getMousePosition(event)

      if (draggedPlayer && selectedTool === "move" && isLayerInteractable("players")) {
        setPlayers((prev) =>
          prev.map((player) =>
            player.id === draggedPlayer
              ? { ...player, position: { x: position.x - dragOffset.x, y: position.y - dragOffset.y } }
              : player,
          ),
        )
      } else if (draggedMarker && selectedTool === "move" && isLayerInteractable("markers")) {
        setMarkers((prev) =>
          prev.map((marker) =>
            marker.id === draggedMarker
              ? { ...marker, position: { x: position.x - dragOffset.x, y: position.y - dragOffset.y } }
              : marker,
          ),
        )
      } else if (draggedWall && selectedTool === "move" && isLayerInteractable("walls")) {
        const wall = walls.find((w) => w.id === draggedWall)
        if (wall) {
          const deltaX = position.x - dragOffset.x - wall.start.x
          const deltaY = position.y - dragOffset.y - wall.start.y
          setWalls((prev) =>
            prev.map((w) =>
              w.id === draggedWall
                ? {
                    ...w,
                    start: { x: w.start.x + deltaX, y: w.start.y + deltaY },
                    end: { x: w.end.x + deltaX, y: w.end.y + deltaY },
                  }
                : w,
            ),
          )
        }
      } else if (isDrawingArrow && (selectedTool === "blueArrow" || selectedTool === "redArrow")) {
        setCurrentArrowEnd(position)
      } else if (isDrawingWall && selectedTool === "wall") {
        setCurrentWallEnd(position)
      }
    },
    [
      draggedPlayer,
      draggedMarker,
      draggedWall,
      selectedTool,
      dragOffset,
      isDrawingArrow,
      isDrawingWall,
      isPanning,
      panStart,
      walls,
      getMousePosition,
      isLayerInteractable,
    ],
  )

  const handleSVGMouseUp = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning) {
        setIsPanning(false)
        return
      }

      if (
        isDrawingArrow &&
        arrowStart &&
        (selectedTool === "blueArrow" || selectedTool === "redArrow") &&
        isLayerInteractable("arrows")
      ) {
        const position = getMousePosition(event)
        const newArrow: Arrow = {
          id: `arrow-${Date.now()}`,
          start: arrowStart,
          end: position,
          color: selectedTool === "blueArrow" ? "#3b82f6" : "#ef4444",
          floor: selectedFloor,
        }
        setArrows((prev) => [...prev, newArrow])
        setIsDrawingArrow(false)
        setArrowStart(null)
        setCurrentArrowEnd(null)
        saveToHistory()
      }

      if (isDrawingWall && wallStart && selectedTool === "wall" && isLayerInteractable("walls")) {
        const position = getMousePosition(event)
        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          start: wallStart,
          end: position,
          floor: selectedFloor,
        }
        setWalls((prev) => [...prev, newWall])
        setIsDrawingWall(false)
        setWallStart(null)
        setCurrentWallEnd(null)
        saveToHistory()
      }

      setDraggedPlayer(null)
      setDraggedMarker(null)
      setDraggedWall(null)
      setDragOffset({ x: 0, y: 0 })
    },
    [
      isDrawingArrow,
      isDrawingWall,
      arrowStart,
      wallStart,
      selectedTool,
      isPanning,
      getMousePosition,
      isLayerInteractable,
      saveToHistory,
      selectedFloor,
    ],
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
      setZoom(newZoom)
    },
    [zoom],
  )

  const handlePlayerMouseDown = useCallback(
    (event: React.MouseEvent, playerId: string) => {
      event.stopPropagation()
      if (!isLayerInteractable("players")) return

      if (selectedTool === "move") {
        const position = getMousePosition(event)
        const player = players.find((p) => p.id === playerId)
        if (player) {
          setDraggedPlayer(playerId)
          setDragOffset({
            x: position.x - player.position.x,
            y: position.y - player.position.y,
          })
        }
      } else if (selectedTool === "erase") {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId))
        saveToHistory()
      } else if (selectedTool === "player") {
        setRoleChangeDialog({ open: true, playerId })
      }
    },
    [selectedTool, players, getMousePosition, isLayerInteractable, saveToHistory],
  )

  const handleMarkerMouseDown = useCallback(
    (event: React.MouseEvent, markerId: string) => {
      event.stopPropagation()
      if (!isLayerInteractable("markers")) return

      if (selectedTool === "move") {
        const position = getMousePosition(event)
        const marker = markers.find((m) => m.id === markerId)
        if (marker) {
          setDraggedMarker(markerId)
          setDragOffset({
            x: position.x - marker.position.x,
            y: position.y - marker.position.y,
          })
        }
      } else if (selectedTool === "erase") {
        setMarkers((prev) => prev.filter((m) => m.id !== markerId))
        saveToHistory()
      }
    },
    [selectedTool, markers, getMousePosition, isLayerInteractable, saveToHistory],
  )

  const handleWallMouseDown = useCallback(
    (event: React.MouseEvent, wallId: string) => {
      event.stopPropagation()
      if (!isLayerInteractable("walls")) return

      if (selectedTool === "move") {
        const position = getMousePosition(event)
        const wall = walls.find((w) => w.id === wallId)
        if (wall) {
          setDraggedWall(wallId)
          setDragOffset({
            x: position.x - wall.start.x,
            y: position.y - wall.start.y,
          })
        }
      } else if (selectedTool === "erase") {
        setWalls((prev) => prev.filter((w) => w.id === wallId))
        saveToHistory()
      }
    },
    [selectedTool, walls, getMousePosition, isLayerInteractable, saveToHistory],
  )

  const handleArrowClick = useCallback(
    (event: React.MouseEvent, arrowId: string) => {
      event.stopPropagation()
      if (selectedTool === "erase" && isLayerInteractable("arrows")) {
        setArrows((prev) => prev.filter((a) => a.id !== arrowId))
        saveToHistory()
      }
    },
    [selectedTool, isLayerInteractable, saveToHistory],
  )

  const handleRoleTabChange = useCallback(
  (team: "attack" | "defense", role: string) => {
    setSelectedTeam(team)
    // 첫 번째 오퍼레이터를 기본값으로 설정
    const ops = OPERATOR_ROLES[team][role as keyof typeof OPERATOR_ROLES[typeof team]]
    if (ops && ops.length > 0) {
      setSelectedPlayerType(ops[0])
    }
  },
  [],
)

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, prev * 1.2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev / 1.2))
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // 파일로 내보내기
  const exportToFile = useCallback(() => {
    const strategy = {
      players,
      arrows,
      markers,
      walls,
      map: selectedMap,
      floor: selectedFloor,
      zoom,
      pan,
      layers,
      language,
      theme,
    }
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fps-strategy-${selectedMap}-${selectedFloor}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [players, arrows, markers, walls, selectedMap, selectedFloor, zoom, pan, layers, language, theme])

  // 파일에서 가져오기
  const importFromFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const strategy = JSON.parse(e.target?.result as string)
            setPlayers(strategy.players || [])
            setArrows(strategy.arrows || [])
            setMarkers(strategy.markers || [])
            setWalls(strategy.walls || [])
            if (strategy.map) setSelectedMap(strategy.map)
            if (strategy.floor) setSelectedFloor(strategy.floor)
            if (strategy.zoom) setZoom(strategy.zoom)
            if (strategy.pan) setPan(strategy.pan)
            if (strategy.layers) setLayers(strategy.layers)
            if (strategy.language) setLanguage(strategy.language)
            if (strategy.theme) setTheme(strategy.theme)
            saveToHistory()
          } catch (error) {
            console.error("Failed to load strategy:", error)
          }
        }
        reader.readAsText(file)
      }
    },
    [saveToHistory],
  )

  // 현재 층의 요소들만 필터링
  const currentFloorPlayers = players.filter((player) => player.floor === selectedFloor)
  const currentFloorArrows = arrows.filter((arrow) => arrow.floor === selectedFloor)
  const currentFloorMarkers = markers.filter((marker) => marker.floor === selectedFloor)
  const currentFloorWalls = walls.filter((wall) => wall.floor === selectedFloor)

  const renderPlayerIcon = (player: Player) => {
    if (!layers.players.visible || player.floor !== selectedFloor) return null

    const typeInfo = PLAYER_TYPES[player.type]
    const IconComponent = typeInfo.icon
    const opacity = layers.players.locked ? 0.6 : 1

    return (
      <g key={player.id} opacity={opacity}>
        <rect
          x={player.position.x - 18}
          y={player.position.y - 18}
          width="36"
          height="36"
          fill={player.team === "attack" ? "#f97316" : "#3b82f6"}
          stroke="white"
          strokeWidth="2"
          className={`${layers.players.locked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
          onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
        />
        <rect
          x={player.position.x - 12}
          y={player.position.y - 12}
          width="24"
          height="24"
          fill={typeInfo.color}
          className="pointer-events-none"
        />
        <foreignObject
          x={player.position.x - 100}  // 아이콘의 절반 크기만큼 이동
          y={player.position.y - 100}
          width="200"
          height="200"
          className="pointer-events-none"
        >
          <div className="w-full h-full flex items-center justify-center">
            <IconComponent className="w-10 h-10 text-white" />
          </div>
        </foreignObject>
        <text
          x={player.position.x}
          y={player.position.y + 32}
          textAnchor="middle"
          fill={theme === "dark" ? "white" : "black"}
          fontSize="10"
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          {player.label}
        </text>
      </g>
    )
  }

  const renderMarker = (marker: TacticalMarker) => {
    if (!layers.markers.visible || marker.floor !== selectedFloor) return null

    const typeInfo = MARKER_TYPES[marker.type]
    const IconComponent = typeInfo.icon
    const opacity = layers.markers.locked ? 0.6 : 1

    return (
      <g key={marker.id} opacity={opacity}>
        <circle
          cx={marker.position.x}
          cy={marker.position.y}
          r="15"
          fill={typeInfo.color}
          stroke="white"
          strokeWidth="2"
          className={`${layers.markers.locked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
          onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
        />
        <foreignObject
          x={marker.position.x - 8}
          y={marker.position.y - 8}
          width="16"
          height="16"
          className="pointer-events-none"
        >
          <IconComponent className="w-4 h-4 text-white" />
        </foreignObject>
      </g>
    )
  }

  const renderWall = (wall: Wall) => {
    if (!layers.walls.visible || wall.floor !== selectedFloor) return null

    const width = Math.abs(wall.end.x - wall.start.x)
    const height = Math.abs(wall.end.y - wall.start.y)
    const x = Math.min(wall.start.x, wall.end.x)
    const y = Math.min(wall.start.y, wall.end.y)
    const opacity = layers.walls.locked ? 0.6 : 1

    return (
      <rect
        key={wall.id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#6b7280"
        stroke="white"
        strokeWidth="2"
        opacity={opacity}
        className={`${layers.walls.locked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
        onMouseDown={(e) => handleWallMouseDown(e, wall.id)}
      />
    )
  }

  const renderArrows = () => {
    if (!layers.arrows.visible) return null

    const opacity = layers.arrows.locked ? 0.6 : 1

    return (
      <g opacity={opacity}>
        <defs>
          <marker id="blueArrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
          <marker id="redArrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>
        {currentFloorArrows.map((arrow) => (
          <>
            {/* 클릭 영역을 위한 투명한 굵은 선 */}
            <line
              key={`${arrow.id}-clickarea`}
              x1={arrow.start.x}
              y1={arrow.start.y}
              x2={arrow.end.x}
              y2={arrow.end.y}
              stroke="transparent"
              strokeWidth="10"
              className={layers.arrows.locked ? "cursor-not-allowed" : "cursor-pointer"}
              onClick={(e) => handleArrowClick(e, arrow.id)}
            />
            {/* 실제 보이는 화살표 */}
            <line
              key={arrow.id}
              x1={arrow.start.x}
              y1={arrow.start.y}
              x2={arrow.end.x}
              y2={arrow.end.y}
              stroke={arrow.color}
              strokeWidth="3"
              markerEnd={arrow.color === "#3b82f6" ? "url(#blueArrowhead)" : "url(#redArrowhead)"}
              className={`${
                layers.arrows.locked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-70"
              } pointer-events-none`}
            />
          </>
        ))}
      </g>
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: currentColors.background }}>
      {/* 네비게이션 바 */}
      <nav
        className="border-b px-4 py-3"
        style={{
          backgroundColor: currentColors.navBackground,
          borderColor: currentColors.border,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold" style={{ color: currentColors.textPrimary }}>
                {t("title")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 테마 선택 */}
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="h-4 w-4" style={{ color: currentColors.textSecondary }} />
              ) : (
                <Moon className="h-4 w-4" style={{ color: currentColors.textSecondary }} />
              )}
              <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("lightTheme")}</SelectItem>
                  <SelectItem value="dark">{t("darkTheme")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 언어 선택 */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: currentColors.textSecondary }} />
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 키보드 단축키 버튼 */}
            <Button variant="ghost" size="sm" onClick={() => setShortcutsDialog(true)}>
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* 맵 변경 경고 다이얼로그 */}
        <AlertDialog
          open={mapChangeDialog.open}
          onOpenChange={(open) => !open && setMapChangeDialog({ open: false, newMap: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("mapChangeWarning")}</AlertDialogTitle>
              <AlertDialogDescription>{t("mapChangeDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMapChange}>{t("confirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 저장 다이얼로그 */}
        <Dialog open={saveDialog.open} onOpenChange={(open) => setSaveDialog({ open, strategyName: "" })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("saveStrategy")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy-name">{t("strategyName")}</Label>
                <Input
                  id="strategy-name"
                  value={saveDialog.strategyName}
                  onChange={(e) => setSaveDialog((prev) => ({ ...prev, strategyName: e.target.value }))}
                  placeholder={t("enterStrategyName")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSaveDialog({ open: false, strategyName: "" })}>
                  {t("cancel")}
                </Button>
                <Button onClick={confirmSave} disabled={!saveDialog.strategyName.trim()}>
                  {t("save")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 불러오기 다이얼로그 */}
        <Dialog open={loadDialog.open} onOpenChange={(open) => setLoadDialog({ open, selectedStrategy: null })}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("loadStrategy")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                {savedStrategies.length === 0 ? (
                  <div className="text-center py-8" style={{ color: currentColors.textSecondary }}>
                    {t("noSavedStrategies")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedStrategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          loadDialog.selectedStrategy === strategy.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                        style={{
                          borderColor: loadDialog.selectedStrategy === strategy.id ? "#3b82f6" : currentColors.border,
                        }}
                        onClick={() => setLoadDialog((prev) => ({ ...prev, selectedStrategy: strategy.id }))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium" style={{ color: currentColors.textPrimary }}>
                              {strategy.name}
                            </h4>
                            <div className="text-sm" style={{ color: currentColors.textSecondary }}>
                              {MAPS[strategy.map].name} - {FLOOR_INFO[strategy.floor].name[language]}
                            </div>
                            <div className="text-xs" style={{ color: currentColors.textSecondary }}>
                              {t("createdAt")}: {new Date(strategy.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(strategy.id)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLoadDialog({ open: false, selectedStrategy: null })}>
                  {t("cancel")}
                </Button>
                <Button onClick={confirmLoad} disabled={!loadDialog.selectedStrategy}>
                  {t("loadSelected")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => !open && setDeleteDialog({ open: false, strategyId: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteStrategy")}</AlertDialogTitle>
              <AlertDialogDescription>{t("deleteStrategyConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>{t("confirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 역할 변경 다이얼로그 */}
        <Dialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog({ open, playerId: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("playerRoleChange")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(PLAYER_TYPES).map(([key, type]) => {
                const IconComponent = type.icon
                return (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handleRoleChange(key as PlayerType)}
                    className="flex items-center gap-2 justify-start"
                  >
                    <IconComponent className="h-4 w-4" style={{ color: type.color }} />
                    {type.name[language]}
                  </Button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* 단축키 도움말 다이얼로그 */}
        <Dialog open={shortcutsDialog} onOpenChange={setShortcutsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                {t("keyboardShortcuts")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t("basicToolsShortcuts")}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>1 - {t("blueArrow")}</div>
                  <div>2 - {t("redArrow")}</div>
                  <div>3 - {t("move")}</div>
                  <div>4 - {t("erase")}</div>
                  <div>5 - {t("mapPan")}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("tacticalMarkersShortcuts")}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Q - {t("wall")}</div>
                  <div>W - {t("dangerZone")}</div>
                  <div>E - {t("watchPoint")}</div>
                  <div>R - {t("objective")}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("floorChangeShortcuts")}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Shift+1 - {FLOOR_INFO.ground.name[language]}</div>
                  <div>Shift+2 - {FLOOR_INFO.upper.name[language]}</div>
                  <div>Shift+3 - {FLOOR_INFO.lower.name[language]}</div>
                  <div>Shift+4 - {FLOOR_INFO.basement.name[language]}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("otherShortcuts")}</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>Delete/Backspace - {t("erase")}</div>
                  <div>Ctrl+S - {t("save")}</div>
                  <div>Ctrl+O - {t("load")}</div>
                  <div>Ctrl+Z - {t("undo")}</div>
                  <div>Ctrl+Y - {t("redo")}</div>
                  <div>F1 - {t("usageHelp")}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 도구 패널 */}
        <Card
          className="w-80 m-4 flex flex-col h-fit max-h-full"
          style={{ backgroundColor: currentColors.cardBackground, borderColor: currentColors.border }}
        >
          <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] p-4">
            {/* 맵 선택 */}
            <Collapsible open={collapsibleState.map} onOpenChange={() => toggleCollapsible("map")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold" style={{ color: currentColors.textPrimary }}>
                    {t("mapSelection")}
                  </h3>
                  {collapsibleState.map ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Select value={selectedMap} onValueChange={handleMapChangeRequest}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MAPS).map(([key, map]) => (
                      <SelectItem key={key} value={key}>
                        {map.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 층 선택 */}
            <Collapsible open={collapsibleState.floors} onOpenChange={() => toggleCollapsible("floors")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: currentColors.textPrimary }}>
                    <Building className="h-4 w-4" />
                    {t("floorSelection")}
                  </h3>
                  {collapsibleState.floors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                  <Select value={selectedFloor} onValueChange={handleFloorChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFloors.map((floor) => {
                        const floorInfo = FLOOR_INFO[floor]
                        const IconComponent = floorInfo.icon
                        return (
                          <SelectItem key={floor} value={floor}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" style={{ color: floorInfo.color }} />
                              {floorInfo.name[language]}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* 층별 요소 개수 표시 */}
                  <div className="text-xs space-y-1" style={{ color: currentColors.textSecondary }}>
                    <div className="font-medium">
                      {t("currentFloor")} ({FLOOR_INFO[selectedFloor].name[language]}):
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        {t("players")}: {currentFloorPlayers.length}
                      </div>
                      <div>
                        {t("arrows")}: {currentFloorArrows.length}
                      </div>
                      <div>
                        {t("markers")}: {currentFloorMarkers.length}
                      </div>
                      <div>
                        {t("walls")}: {currentFloorWalls.length}
                      </div>
                    </div>
                  </div>

                  {/* 빠른 층 변경 버튼 */}
                  <div className="grid grid-cols-2 gap-1">
                    {availableFloors.map((floor) => {
                      const floorInfo = FLOOR_INFO[floor]
                      const IconComponent = floorInfo.icon
                      return (
                        <Button
                          key={floor}
                          variant={selectedFloor === floor ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFloorChange(floor)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <IconComponent className="h-3 w-3" />
                          {floorInfo.name[language].split(" ")[0]}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 레이어 관리 */}
            <Collapsible open={collapsibleState.layers} onOpenChange={() => toggleCollapsible("layers")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: currentColors.textPrimary }}>
                    <Layers className="h-4 w-4" />
                    {t("layerManagement")}
                  </h3>
                  {collapsibleState.layers ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                  {Object.entries(LAYER_INFO).map(([key, info]) => {
                    const layerType = key as LayerType
                    const layer = layers[layerType]
                    const IconComponent = info.icon
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded border"
                        style={{ borderColor: currentColors.border }}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" style={{ color: info.color }} />
                          <span className="text-sm font-medium" style={{ color: currentColors.textPrimary }}>
                            {info.name[language]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLayerVisibility(layerType)}
                            className="h-6 w-6 p-0"
                          >
                            {layer.visible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" style={{ color: currentColors.textSecondary }} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLayerLock(layerType)}
                            className="h-6 w-6 p-0"
                          >
                            {layer.locked ? <Lock className="h-3 w-3 text-red-500" /> : <Unlock className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 플레이어 배치 */}
              <Collapsible
                open={collapsibleState.playerPlacement}
                onOpenChange={() => toggleCollapsible("playerPlacement")}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: currentColors.textPrimary }}>
                      <Users className="h-4 w-4" />
                      {t("playerPlacement")}
                    </h3>
                    {collapsibleState.playerPlacement ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4">
                  <div className="space-y-2">
  <label className="text-sm font-medium" style={{ color: currentColors.textPrimary }}>
    {t("roleSelection")}
  </label>
  <Tabs
      defaultValue={selectedTeam}
      value={selectedTeam}
      onValueChange={v => {
        // 팀이 바뀌면 기본 역할로 변경
        if (v === "attack") {
          handleRoleTabChange("attack", "entry")
        } else {
          handleRoleTabChange("defense", "anchor")
        }
      }}
    >
    <TabsList>
      <TabsTrigger value="attack">{t("attack")}</TabsTrigger>
      <TabsTrigger value="defense">{t("defense")}</TabsTrigger>
    </TabsList>
    <TabsContent value="attack">
      <Tabs
        defaultValue="entry"
        onValueChange={role => handleRoleTabChange("attack", role)}
      >
        <TabsList>
          <TabsTrigger value="entry">엔트리</TabsTrigger>
          <TabsTrigger value="hardBreacher">하드브리처</TabsTrigger>
          <TabsTrigger value="support">서포트</TabsTrigger>
        </TabsList>
        {Object.entries(OPERATOR_ROLES.attack).map(([roleKey, ops]) => (
          <TabsContent key={roleKey} value={roleKey}>
            <Select
              value={selectedPlayerType}
              onValueChange={(value: PlayerType) => setSelectedPlayerType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {ops.map(op => {
                  const IconComponent = PLAYER_TYPES[op].icon
                  return (
                    <SelectItem key={op} value={op}>
                      <div className="flex items-center gap-1">
                        {/* 역할 선택창 아이콘을 더 작게 */}
                        <IconComponent className="h-2 w-2" style={{ color: PLAYER_TYPES[op].color }} />
                        {PLAYER_TYPES[op].name[language]}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </TabsContent>
        ))}
      </Tabs>
    </TabsContent>
    <TabsContent value="defense">
      <Tabs
        defaultValue="anchor"
        onValueChange={role => handleRoleTabChange("defense", role)}
      >
        <TabsList>
          <TabsTrigger value="anchor">앵커</TabsTrigger>
          <TabsTrigger value="roamer">로머</TabsTrigger>
        </TabsList>
        {Object.entries(OPERATOR_ROLES.defense).map(([roleKey, ops]) => (
          <TabsContent key={roleKey} value={roleKey}>
            <Select
              value={selectedPlayerType}
              onValueChange={(value: PlayerType) => setSelectedPlayerType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ops.map(op => {
                  const IconComponent = PLAYER_TYPES[op].icon
                  return (
                    <SelectItem key={op} value={op}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" style={{ color: PLAYER_TYPES[op].color }} />
                        {PLAYER_TYPES[op].name[language]}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </TabsContent>
        ))}
      </Tabs>
    </TabsContent>
  </Tabs>
</div>

                  {/* 배치 버튼 */}
                  <Button
                    variant={selectedTool === "player" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("player")}
                    className="w-full flex items-center gap-2"
                    disabled={layers.players.locked}
                  >
                    <Users className="h-2 w-2" />
                    {t(selectedTeam)} {PLAYER_TYPES[selectedPlayerType].name[language]} {t("placePlayer")}
                  </Button>
                </CollapsibleContent>
              </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 기본 도구 */}
            <Collapsible open={collapsibleState.basicTools} onOpenChange={() => toggleCollapsible("basicTools")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold" style={{ color: currentColors.textPrimary }}>
                    {t("basicTools")}
                  </h3>
                  {collapsibleState.basicTools ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTool === "blueArrow" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("blueArrow")}
                    className="flex items-center gap-1"
                    disabled={layers.arrows.locked}
                  >
                    <ArrowRight className="h-4 w-4 text-blue-500" />
                    {t("blueArrow")} <span className="text-xs opacity-60">1</span>
                  </Button>
                  <Button
                    variant={selectedTool === "redArrow" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("redArrow")}
                    className="flex items-center gap-1"
                    disabled={layers.arrows.locked}
                  >
                    <ArrowRight className="h-4 w-4 text-red-500" />
                    {t("redArrow")} <span className="text-xs opacity-60">2</span>
                  </Button>
                  <Button
                    variant={selectedTool === "move" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("move")}
                    className="flex items-center gap-1"
                  >
                    <Move className="h-4 w-4" />
                    {t("move")} <span className="text-xs opacity-60">3</span>
                  </Button>
                  <Button
                    variant={selectedTool === "erase" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("erase")}
                    className="flex items-center gap-1"
                  >
                    <Eraser className="h-4 w-4" />
                    {t("erase")} <span className="text-xs opacity-60">4</span>
                  </Button>
                  <Button
                    variant={selectedTool === "pan" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("pan")}
                    className="flex items-center gap-1 col-span-2"
                  >
                    <Hand className="h-4 w-4" />
                    {t("mapPan")} <span className="text-xs opacity-60">5</span>
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 전술 마커 */}
            <Collapsible
              open={collapsibleState.tacticalMarkers}
              onOpenChange={() => toggleCollapsible("tacticalMarkers")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold" style={{ color: currentColors.textPrimary }}>
                    {t("tacticalMarkers")}
                  </h3>
                  {collapsibleState.tacticalMarkers ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTool === "wall" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("wall")}
                    className="flex items-center gap-1"
                    disabled={layers.walls.locked}
                  >
                    <Square className="h-4 w-4" />
                    {t("wall")} <span className="text-xs opacity-60">Q</span>
                  </Button>
                  {Object.entries(MARKER_TYPES).map(([key, type]) => {
                    const IconComponent = type.icon
                    const shortcut = { danger: "W", watch: "E", objective: "R" }[key as MarkerType]
                    return (
                      <Button
                        key={key}
                        variant={selectedTool === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool(key as Tool)}
                        className="flex items-center gap-1"
                        disabled={layers.markers.locked}
                      >
                        <IconComponent className="h-4 w-4" />
                        {type.name[language].split(" ")[0]} <span className="text-xs opacity-60">{shortcut}</span>
                      </Button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 맵 컨트롤 */}
            <Collapsible open={collapsibleState.mapControls} onOpenChange={() => toggleCollapsible("mapControls")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold" style={{ color: currentColors.textPrimary }}>
                    {t("mapControls")}
                  </h3>
                  {collapsibleState.mapControls ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetView} className="flex-1">
                    {language === "ko" ? "리셋" : language === "ja" ? "リセット" : "Reset"}
                  </Button>
                </div>
                <div className="text-xs" style={{ color: currentColors.textSecondary }}>
                  {t("zoom")}: {Math.round(zoom * 100)}%
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            {/* 액션 */}
            <Collapsible open={collapsibleState.actions} onOpenChange={() => toggleCollapsible("actions")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold" style={{ color: currentColors.textPrimary }}>
                    {t("actions")}
                  </h3>
                  {collapsibleState.actions ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={historyIndex <= 0}
                      className="w-full flex items-center gap-1 Default"
                    >
                      <Undo className="h-4 w-4" />
                      {t("undo")} <span className="text-xs opacity-60">Ctrl+Z</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      className="w-full flex items-center gap-1 Default"
                    >
                      <Redo className="h-4 w-4" />
                      {t("redo")} <span className="text-xs opacity-60">Ctrl+Y</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="w-full flex items-center gap-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("reset")}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      className="w-full flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      {t("save")} <span className="text-xs opacity-60">Ctrl+S</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoad}
                      className="w-full flex items-center gap-1 text-center"
                    >
                      <FolderOpen className="h-4 w-4" />
                      {t("load")} <span className="text-xs opacity-60">Ctrl+O</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToFile}
                    className="w-full flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    {t("export")}
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center gap-1"
                      onClick={() => document.getElementById("file-input")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {t("import")}
                    </Button>
                    <input id="file-input" type="file" accept=".json" onChange={importFromFile} className="hidden" />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator style={{ backgroundColor: currentColors.border }} />

            <div className="text-xs space-y-1" style={{ color: currentColors.textSecondary }}>
              <p>
                <strong>{t("usage")}:</strong>
              </p>
              <p>• F1: {t("usageHelp")}</p>
              <p>• Shift+1-4: {t("usageFloorChange")}</p>
              <p>• {t("usageLayer")}</p>
              <p>• {t("usageLock")}</p>
              <p>• {t("usageMapChange")}</p>
              <p>• {t("usageFloorSeparation")}</p>
            </div>
          </CardContent>
        </Card>

        {/* 지도 영역 */}
        <div className="flex-1 m-4 ml-0 flex items-center justify-center">
          <Card
            className="aspect-square w-full max-w-[min(100%,calc(100vh-120px))] h-full max-h-[calc(100vh-120px)]"
            style={{ backgroundColor: currentColors.cardBackground, borderColor: currentColors.border }}
          >
            <CardContent className="p-0 h-full overflow-hidden">
              <svg
                ref={svgRef}
                className="w-full h-full"
                onMouseDown={handleSVGMouseDown}
                onMouseMove={handleSVGMouseMove}
                onMouseUp={handleSVGMouseUp}
                onWheel={handleWheel}
                style={{
                  cursor:
                    selectedTool === "move"
                      ? "move"
                      : selectedTool === "blueArrow" || selectedTool === "redArrow" || selectedTool === "wall"
                        ? "crosshair"
                        : selectedTool === "pan"
                          ? "grab"
                          : "pointer",
                  backgroundColor: MAPS[selectedMap].background[theme],
                }}
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* 격자 배경 */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />

                  {/* 맵 라벨 */}
                  <text
                    x="20"
                    y="30"
                    fill={theme === "dark" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)"}
                    fontSize="18"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {MAPS[selectedMap].name} - {FLOOR_INFO[selectedFloor].name[language]}
                  </text>

                  {/* 벽 (가장 아래 레이어) */}
                  {currentFloorWalls.map(renderWall)}

                  {/* 벽 그리기 중 미리보기 */}
                  {isDrawingWall && wallStart && currentWallEnd && layers.walls.visible && (
                    <rect
                      x={Math.min(wallStart.x, currentWallEnd.x)}
                      y={Math.min(wallStart.y, currentWallEnd.y)}
                      width={Math.abs(currentWallEnd.x - wallStart.x)}
                      height={Math.abs(currentWallEnd.y - wallStart.y)}
                      fill="#6b7280"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="6,3"
                      className="pointer-events-none"
                      opacity="0.7"
                    />
                  )}

                  {/* 화살표 */}
                  {renderArrows()}

                  {/* 화살표 그리기 중 미리보기 */}
                  {isDrawingArrow && arrowStart && currentArrowEnd && layers.arrows.visible && (
                    <line
                      x1={arrowStart.x}
                      y1={arrowStart.y}
                      x2={currentArrowEnd.x}
                      y2={currentArrowEnd.y}
                      stroke={selectedTool === "blueArrow" ? "#3b82f6" : "#ef4444"}
                      strokeWidth="3"
                      strokeDasharray="6,3"
                      markerEnd={selectedTool === "blueArrow" ? "url(#blueArrowhead)" : "url(#redArrowhead)"}
                      className="pointer-events-none"
                    />
                  )}

                  {/* 전술 마커 */}
                  {currentFloorMarkers.map(renderMarker)}

                  {/* 플레이어 (가장 위 레이어) */}
                  {currentFloorPlayers.map(renderPlayerIcon)}
                </g>
              </svg>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
