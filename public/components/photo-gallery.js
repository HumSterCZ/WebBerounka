class PhotoGallery extends HTMLElement {
    connectedCallback() {
        const folder = this.getAttribute('folder') || 'default';
        const count = this.getAttribute('count') || 3;
        
        this.innerHTML = `
            <div class="photo-grid">
                ${this.generatePhotos(folder, count)}
            </div>
        `;
    }

    generatePhotos(folder, count) {
        let photos = '';
        for(let i = 1; i <= count; i++) {
            photos += `
                <div class="photo-item">
                    <img src="/images/${folder}/foto-${i}.jpg" 
                         alt="Fotografie ${i}"
                         loading="lazy">
                    <p>Popis fotografie ${i}</p>
                </div>
            `;
        }
        return photos;
    }
}

customElements.define('photo-gallery', PhotoGallery);
