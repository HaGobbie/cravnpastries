const GH_OWNER  = import.meta.env.VITE_GH_OWNER;
const GH_REPO   = import.meta.env.VITE_GH_REPO;
const GH_TOKEN  = import.meta.env.VITE_GH_TOKEN;
const GH_BRANCH = import.meta.env.VITE_GH_BRANCH;

export const uploadImageToGitHub = async (file) => {
  const ts    = Date.now();
  const ext   = file.name.split('.').pop().toLowerCase();
  const fname = `dessert_${ts}.${ext}`;
  const path  = fname;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${GH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Upload dessert image ${fname}`,
              content: base64,
              branch:  GH_BRANCH,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          reject(new Error(err.message || 'GitHub upload failed'));
          return;
        }
        resolve(`https://github.com/${GH_OWNER}/${GH_REPO}/blob/${GH_BRANCH}/${path}?raw=true`);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
