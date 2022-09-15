import { createRoot } from 'react-dom/client';
import { App } from "./app";



const root = createRoot(
    document.getElementById('root') as HTMLElement
  );
  
  root.render(
    <App />
  );

  reportWebVitals();
  


  