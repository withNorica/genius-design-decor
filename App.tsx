// VERSIUNEA FINALĂ ȘI COMPLETĂ - COPIAZĂ ȘI LIPEȘTE TOT ACEST COD

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { DESIGN_STYLES, HOLIDAYS, EVENTS, SEASONAL_THEMES } from './constants';
import { FlowType, GenerationResult, DesignSuggestions, DecorSuggestions } from './types';
import { generateUUID } from './utils';
import { ImageInput } from './components/ImageInput';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { addResult, getResult, initDB } from './idb';
import { supabase } from './lib/supabase';

// Main App component with Router
const App: React.FC = () => {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><StandardLayout><HomePage /></StandardLayout></ProtectedRoute>} />
          <Route path="/design" element={<ProtectedRoute><StandardLayout><DesignPage flowType={FlowType.Design} /></StandardLayout></ProtectedRoute>} />
          <Route path="/decor" element={<ProtectedRoute><StandardLayout><DesignPage flowType={FlowType.Decor} /></StandardLayout></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/s/:id" element={<SharePage />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

// Standard Layout for Home and Form pages
const StandardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const { data, error } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (data && !error) setCredits(data.credits);
      }
    };
    fetchCredits();
  }, [user]);

  return (
    <div className="min-h-screen bg-stone-50 text-gray-800 font-sans">
      <header className="p-4 bg-white shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">Genius Design & Decor</Link>
        <div className="flex items-center gap-4">
          {credits !== null && (<span className="text-sm font-medium text-gray-700">Credits left: {credits}</span>)}
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Sign Out</button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="text-center p-4 mt-8 text-sm text-gray-500 border-t border-slate-200">
        Powered by Gemini AI. Generated images are illustrative.
      </footer>
    </div>
  );
};

// HomePage Component
const HomePage: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center p-8">
    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900">Genius Design & Decor</h1>
    <p className="text-xl text-[#E75480]">AI Ideas for Interiors, Exteriors & Gardens</p>
    <p className="max-w-xl text-gray-500">Transform your space with AI. Upload a photo and get instant inspiration for your next project.</p>
    <div className="flex flex-col sm:flex-row gap-4 mt-4">
      <Link to="/design"><Button className="w-56 h-24 flex-col"><span className="text-2xl font-semibold">Design</span></Button></Link>
      <Link to="/decor"><Button className="w-56 h-24 flex-col"><span className="text-2xl font-semibold">Decor</span></Button></Link>
    </div>
  </div>
);

// DesignPage Component (handles both Design and Decor)
interface DesignPageProps {
  flowType: FlowType;
}
const DesignPage: React.FC<DesignPageProps> = ({ flowType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [style, setStyle] = useState<string>(DESIGN_STYLES[0]);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [designStyles, setDesignStyles] = useState(DESIGN_STYLES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const initialPresetFields = { name: '', colorPalette: '', furnitureTypes: '', decorElements: '', overallMood: '' };
  const [customPresetFields, setCustomPresetFields] = useState(initialPresetFields);
  const [holiday, setHoliday] = useState(HOLIDAYS[0]);
  const [event, setEvent] = useState(EVENTS[0]);
  const [seasonalTheme, setSeasonalTheme] = useState(SEASONAL_THEMES[0]);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const { data, error } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (data && !error) setCredits(data.credits);
      }
    };
    fetchCredits();
  }, [user]);

  useEffect(() => {
    if (location.state && location.state.imageBase64) {
        const { imageBase64, imageMimeType, style, details, holiday, event, seasonalTheme } = location.state as Partial<GenerationResult> & { imageMimeType?: string };
        if (imageBase64 && imageMimeType) {
            const mockFile = new File([], "previous-image", { type: imageMimeType });
            setImageFile(mockFile);
            setImageBase64(imageBase64);
        }
        if (style) {
            if (!designStyles.includes(style)) setDesignStyles(prev => [style, ...prev]);
            setStyle(style);
        }
        if (details) setDetails(details);
        if (holiday) setHoliday(holiday);
        if (event) setEvent(event);
        if (seasonalTheme) setSeasonalTheme(seasonalTheme);
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, designStyles]);

  const handleImageSelect = (file: File, base64: string) => { setImageFile(file); setImageBase64(base64); };
  const handleReplaceImage = () => { setImageFile(null); setImageBase64(null); };

  const handleSaveCustomStyle = () => {
    const { name, colorPalette, furnitureTypes, decorElements, overallMood } = customPresetFields;
    if (name.trim()) {
        const newStyles = [name, ...designStyles.filter(s => s !== name)];
        setDesignStyles(newStyles);
        setStyle(name);
        const presetDetails = [
            colorPalette ? `Color Palette: ${colorPalette}` : '',
            furnitureTypes ? `Furniture Types: ${furnitureTypes}` : '',
            decorElements ? `Decor Elements: ${decorElements}` : '',
            overallMood ? `Overall Mood: ${overallMood}` : '',
        ].filter(Boolean).join('. ');
        setDetails(presetDetails);
        setIsModalOpen(false);
        setCustomPresetFields(initialPresetFields);
    }
  };

  const handlePresetFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomPresetFields(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credits !== null && credits <= 0) {
      setIsUpgradeModalOpen(true);
      return;
    }
    if (!imageBase64 || !imageFile) {
      setError("Please upload an image first.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Generating your design...');
    try {
      const cleanedBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const submissionStyle = flowType === FlowType.Design ? style : "thematic decor";
      const decorHoliday = flowType === FlowType.Decor ? holiday : undefined;
      const decorEvent = flowType === FlowType.Decor ? event : undefined;
      const decorTheme = flowType === FlowType.Decor ? seasonalTheme : undefined;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-decor`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanedBase64, imageMimeType: imageFile.type,
          style: submissionStyle, details, flowType,
          holiday: decorHoliday, event: decorEvent, seasonalTheme: decorTheme,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed.');
      }
      const resultData = await response.json();
      setLoadingMessage('Finalizing your results...');
      const id = generateUUID();
      const resultToStore: GenerationResult = {
        id, type: flowType,
        generatedImageBase64: [`data:image/png;base64,${resultData.image}`],
        style: submissionStyle, details, suggestions: resultData.suggestions,
        imageBase64, imageMimeType: imageFile.type,
        holiday: decorHoliday, event: decorEvent, seasonalTheme: decorTheme,
      };
      await addResult(resultToStore);
      if (credits !== null) setCredits(credits - 1);
      navigate(`/result/${id}`);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
      
  const title = flowType === FlowType.Design ? 'Design your Space' : 'Decorate your Space';
  const description = flowType === FlowType.Design ? "Upload a photo of your room, house exterior, or garden to get new design ideas." : "Get creative decoration suggestions for any space.";
  const formInputStyles = "block w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors";

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold capitalize text-[#E75480]">{title}</h1>
        <p className="text-lg text-gray-600 mt-2">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="w-full bg-white p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-2xl font-semibold text-center">1. Your Image</h2>
          <ImageInput onImageSelect={handleImageSelect} imagePreview={imageBase64} onImageRemove={handleReplaceImage} />
        </div>
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold">2. {flowType === FlowType.Design ? 'Select a Design Style' : 'Choose Your Decor Theme'}</h2>
            {flowType === FlowType.Design && (
                <div>
                    <label htmlFor="style" className="block text-sm font-medium text-gray-700">Design Style</label>
                    <div className="flex items-center gap-2">
                        <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} className={formInputStyles}>
                            {designStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsModalOpen(true)} className="text-sm text-[#E75480] hover:text-[#D2436D] font-medium whitespace-nowrap">Create style</button>
                    </div>
                </div>
            )}
            {flowType === FlowType.Decor && (
                <>
                    <div><label htmlFor="holiday" className="block text-sm font-medium text-gray-700">Major Holidays &amp; Events</label><select id="holiday" value={holiday} onChange={(e) => setHoliday(e.target.value)} className={formInputStyles}>{HOLIDAYS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                    <div><label htmlFor="event" className="block text-sm font-medium text-gray-700">Parties &amp; Social Events</label><select id="event" value={event} onChange={(e) => setEvent(e.target.value)} className={formInputStyles}>{EVENTS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                    <div><label htmlFor="seasonalTheme" className="block text-sm font-medium text-gray-700">Seasonal / Style Themes</label><select id="seasonalTheme" value={seasonalTheme} onChange={(e) => setSeasonalTheme(e.target.value)} className={formInputStyles}>{SEASONAL_THEMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                </>
            )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">3. Add Specific Changes (optional)</h2>
          <textarea id="details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={flowType === FlowType.Design ? "e.g., 'Bright and airy living room...'" : "e.g., 'Cozy winter vibe...'"} className={formInputStyles}/>
          <p className="mt-2 text-sm text-gray-500">💡 Example: change only the sofa, add more plants.</p>
        </div>
        <div>
            <Button type="submit" isLoading={isLoading} disabled={!imageBase64} className="w-full">
                {isLoading ? loadingMessage : `Generate ${flowType} Ideas`}
            </Button>
            {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
        </div>
      </form>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Custom Style Preset" footer={<><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button><button onClick={handleSaveCustomStyle} className="px-4 py-2 text-sm font-medium text-white bg-[#E75480] border border-transparent rounded-md hover:bg-[#D2436D]">Save Preset</button></>}>
        <div className="space-y-4">
            <div><label htmlFor="preset-name" className="block text-sm font-medium text-gray-700">Preset Name</label><input type="text" id="preset-name" name="name" value={customPresetFields.name} onChange={handlePresetFieldChange} placeholder="e.g., 'Cozy Cottage'" className={formInputStyles}/></div>
            <div><label htmlFor="color-palette" className="block text-sm font-medium text-gray-700">Color Palette</label><textarea id="color-palette" name="colorPalette" rows={2} value={customPresetFields.colorPalette} onChange={handlePresetFieldChange} placeholder="e.g., 'Earthy tones, cream'" className={formInputStyles}/></div>
            <div><label htmlFor="furniture-types" className="block text-sm font-medium text-gray-700">Furniture Types</label><textarea id="furniture-types" name="furnitureTypes" rows={2} value={customPresetFields.furnitureTypes} onChange={handlePresetFieldChange} placeholder="e.g., 'Plush sofas, rustic wood'" className={formInputStyles}/></div>
            <div><label htmlFor="decor-elements" className="block text-sm font-medium text-gray-700">Decor Elements</label><textarea id="decor-elements" name="decorElements" rows={2} value={customPresetFields.decorElements} onChange={handlePresetFieldChange} placeholder="e.g., 'Woven textiles, houseplants'" className={formInputStyles}/></div>
            <div><label htmlFor="overall-mood" className="block text-sm font-medium text-gray-700">Overall Mood</label><textarea id="overall-mood" name="overallMood" rows={2} value={customPresetFields.overallMood} onChange={handlePresetFieldChange} placeholder="e.g., 'Warm, inviting, and peaceful'" className={formInputStyles}/></div>
        </div>
      </Modal>

      <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title="No Credits Left" footer={<><button onClick={() => setIsUpgradeModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition">Close</button><a href="https://www.geniusdesigndecor.com/pricing" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium text-white bg-[#E75480] border border-transparent rounded-md shadow-sm hover:bg-[#D2436D] transition">View Pricing</a></>}>
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-2">You have run out of free credits.</p>
          <p className="text-sm text-gray-500">Please visit our pricing page to purchase more credits and continue generating amazing designs.</p>
        </div>
      </Modal>
    </div>
  );
};

// ... (restul componentelor, ResultPage, SharePage, etc. rămân la fel) ...
// ... (codul de mai jos este doar pentru a completa fișierul, este identic cu ce ai deja) ...

const SuggestionsList: React.FC<{title: string; items: string[]}> = ({ title, items }) => ( <div className="mb-6"><h3 className="text-lg font-bold mb-3 text-[#E75480]">{title}:</h3><ul className="list-disc list-inside space-y-2 text-gray-700">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div> );
const DesignSuggestionsDisplay: React.FC<{suggestions: DesignSuggestions}> = ({ suggestions }) => ( <>{suggestions.general && <SuggestionsList title="Actionable Suggestions" items={suggestions.general} />}{suggestions.lowBudget && <SuggestionsList title="Budget-Friendly" items={suggestions.lowBudget} />}{suggestions.diy && <SuggestionsList title="DIY Ideas" items={suggestions.diy} />}</> );
const DecorSuggestionsDisplay: React.FC<{suggestions: DecorSuggestions}> = ({ suggestions }) => ( <>{suggestions.general && <SuggestionsList title="Actionable Suggestions" items={suggestions.general} />}{suggestions.lowBudget && <SuggestionsList title="Budget-Friendly" items={suggestions.lowBudget} />}{suggestions.diy && <SuggestionsList title="DIY Ideas" items={suggestions.diy} />}</> );

const ResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [shareStatus, setShareStatus] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);

    useEffect(() => { if (id) getResult(id).then(setResult).catch(console.error); }, [id]);

    const images = result ? (Array.isArray(result.generatedImageBase64) ? result.generatedImageBase64 : [result.generatedImageBase64]) : [];
    const handleOpenImageModal = (imageUrl: string) => { setModalImageSrc(imageUrl); setIsImageModalOpen(true); };
    const handleCloseImageModal = () => { setIsImageModalOpen(false); setModalImageSrc(null); };

    const handleDownload = () => { if (!result || images.length === 0) return; const link = document.createElement('a'); link.href = images[selectedImageIndex]; link.download = `genius-design-${result.id}-${selectedImageIndex + 1}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    const handleShare = async () => { if (!result) return; setShareStatus(''); const shareUrl = `${window.location.origin}/#/s/${result.id}`; try { await navigator.share({ title: 'Genius Design & Decor', text: 'Check out these designs!', url: shareUrl }); } catch (error) { try { await navigator.clipboard.writeText(shareUrl); setShareStatus('Link copied!'); setTimeout(() => setShareStatus(''), 3000); } catch (copyError) { setShareStatus('Could not copy link.'); setTimeout(() => setShareStatus(''), 3000); }}};
    const handleGenerateAgain = () => { if (!result) return; navigate(`/${result.type}`, { state: { imageBase64: result.imageBase64, imageMimeType: result.imageMimeType, style: result.style, details: result.details, holiday: result.holiday, event: result.event, seasonalTheme: result.seasonalTheme } }); };
    const handleSaveText = () => { if (!result) return; let textContent = `Genius Design & Decor Suggestions\n\n`; if (result.type === FlowType.Decor) { const decor = result.suggestions as DecorSuggestions; textContent += `General:\n${decor.general.join('\n')}\n\nBudget-Friendly:\n${decor.lowBudget.join('\n')}\n\nDIY:\n${decor.diy.join('\n')}`; } else { const design = result.suggestions as DesignSuggestions; textContent += `Style: ${result.style}\n\nGeneral:\n${design.general.join('\n')}\n\nBudget-Friendly:\n${design.lowBudget.join('\n')}\n\nDIY:\n${design.diy.join('\n')}`; } const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `genius-design-suggestions-${result.id}.txt`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };

    if (!result) return <div className="text-center p-12">Loading...</div>;
    const pageTitle = result.type === FlowType.Decor ? "Decorated Image" : "Redesigned Image";
    const suggestionsTitle = result.type === FlowType.Decor ? "Decor Suggestions" : `Design Suggestions (Style: ${result.style})`;

    return ( <div className="min-h-screen bg-stone-50 p-4 sm:p-8"><header className="text-center mb-8 max-w-4xl mx-auto"><Link to="/" className="text-5xl font-bold text-[#E75480]">Genius Design & Decor</Link><p className="text-gray-600 mt-2">Your AI-powered result.</p></header><main className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8"><div className="bg-white p-6 rounded-xl shadow-lg"><h2 className="text-2xl font-bold text-center mb-4">{pageTitle}</h2>{result.imageBase64 && images.length > 0 && <BeforeAfterSlider beforeImage={result.imageBase64} afterImage={images[selectedImageIndex]} />}<div className="flex justify-center gap-4 pt-4">{images.map((img, index) => ( <img key={index} src={img} alt={`Variation ${index + 1}`} onClick={() => { setSelectedImageIndex(index); handleOpenImageModal(img); }} className={`w-24 h-24 object-cover rounded-md cursor-pointer border-4 ${selectedImageIndex === index ? 'border-[#E75480]' : 'border-transparent'}`}/>))}</div><div className="grid grid-cols-2 gap-4 pt-6"><Button onClick={handleDownload}>Download</Button><Button onClick={handleShare}>Share</Button><Button onClick={handleGenerateAgain}>Generate Again</Button><Button onClick={() => navigate('/')}>Home</Button></div>{shareStatus && <p className="text-center text-sm text-green-600 mt-2">{shareStatus}</p>}</div><div className="bg-white p-6 rounded-xl shadow-lg"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{suggestionsTitle}</h2><button onClick={handleSaveText} className="px-3 py-1.5 border rounded-lg text-sm">Save Text</button></div><div className="h-[70vh] overflow-y-auto pr-2">{result.type === FlowType.Design ? <DesignSuggestionsDisplay suggestions={result.suggestions as DesignSuggestions} /> : <DecorSuggestionsDisplay suggestions={result.suggestions as DecorSuggestions} />}</div></div></main><footer className="text-center p-4 mt-8 text-sm">Powered by Gemini AI.</footer><Modal isOpen={isImageModalOpen} onClose={handleCloseImageModal} title="Image Preview">{modalImageSrc && <img src={modalImageSrc} alt="Enlarged preview"/>}</Modal></div> );
};

const SharePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [result, setResult] = useState<GenerationResult | null>(null);
    useEffect(() => { if (id) getResult(id).then(setResult).catch(console.error); }, [id]);
    const handleDownload = (imageUrl: string, index: number) => { if (!result) return; const link = document.createElement('a'); link.href = imageUrl; link.download = `genius-design-${result.id}-${index + 1}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    if (!result) return <div className="text-center p-12">Not found.</div>;
    const pageTitle = result.type === FlowType.Decor ? "Decorated Variations" : "Redesigned Variations";
    const images = Array.isArray(result.generatedImageBase64) ? result.generatedImageBase64 : [result.generatedImageBase64];
    return ( <div className="min-h-screen bg-stone-50 p-4 sm:p-8"><header className="text-center mb-8"><h1 className="text-5xl font-bold text-[#E75480]">Genius Design & Decor</h1><p className="mt-2">A shared design</p><Link to="/" className="mt-4 text-[#E75480] hover:underline">&larr; Create Your Own</Link></header><main className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8"><div className="bg-white p-4 rounded-xl shadow-lg"><h2 className="text-xl font-bold text-center mb-4">{pageTitle}</h2><div className="space-y-4">{images.map((img, index) => ( <div key={index} className="relative group"><img src={img} alt={`Variation ${index + 1}`} /><button onClick={() => handleDownload(img, index)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100">Download</button></div>))}</div></div><div className="bg-white p-6 rounded-xl shadow-lg"><h2 className="text-xl font-bold mb-4">Suggestions</h2><div className="h-[70vh] overflow-y-auto pr-2">{result.type === FlowType.Design ? <DesignSuggestionsDisplay suggestions={result.suggestions as DesignSuggestions} /> : <DecorSuggestionsDisplay suggestions={result.suggestions as DecorSuggestions} />}</div></div></main><footer className="text-center p-4 mt-8 text-sm">Powered by Gemini AI.</footer></div> );
};

export default App;
