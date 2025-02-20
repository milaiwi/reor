import React from 'react';

type AdaptContextType = {
  when: boolean;
  AdaptProvider: React.FC<{ children: React.ReactNode }>;
};

const AdaptContext = React.createContext<AdaptContextType | null>(null);

export const useAdapt = () => {
  const context = React.useContext(AdaptContext);
  if (!context) {
    throw new Error('useAdapt must be used within an AdaptProvider');
  }
  return context;
};

export const useAdaptParent = (contents: React.ReactNode) => {
  const [when, setWhen] = React.useState(false);

  const AdaptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <AdaptContext.Provider value={{ when, AdaptProvider }}>
        {children}
        {when && contents}
      </AdaptContext.Provider>
    );
  };

  return { when, AdaptProvider };
};