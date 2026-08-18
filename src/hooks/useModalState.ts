import { useState } from 'react';

/**
 * 各種モーダルダイアログおよび Zen モードの表示・非表示状態を管理するカスタムフック
 */
export function useModalState() {
  const [isZenMode, setIsZenMode] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpGuideModalOpen, setIsHelpGuideModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isBatchConvertModalOpen, setIsBatchConvertModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const toggleZenMode = () => setIsZenMode((prev) => !prev);
  const closeAllModals = () => {
    setIsTableModalOpen(false);
    setIsTemplateModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsAboutModalOpen(false);
    setIsHelpGuideModalOpen(false);
    setIsShortcutsModalOpen(false);
    setIsDiffModalOpen(false);
    setIsBatchConvertModalOpen(false);
    setIsLogModalOpen(false);
    setIsStatsModalOpen(false);
  };

  return {
    isZenMode,
    setIsZenMode,
    toggleZenMode,
    isTableModalOpen,
    setIsTableModalOpen,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isHelpGuideModalOpen,
    setIsHelpGuideModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isDiffModalOpen,
    setIsDiffModalOpen,
    isBatchConvertModalOpen,
    setIsBatchConvertModalOpen,
    isLogModalOpen,
    setIsLogModalOpen,
    isStatsModalOpen,
    setIsStatsModalOpen,
    closeAllModals,
  };
}
