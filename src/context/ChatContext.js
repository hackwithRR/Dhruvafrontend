import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [classLevel, setClassLevel] = useState('10');
  const [examPrepMode, setExamPrepMode] = useState('quiz');
  
  return (
    <ChatContext.Provider value={{
      subject, setSubject,
      chapter, setChapter,
      board, setBoard,
      classLevel, setClassLevel,
      examPrepMode, setExamPrepMode
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

