/*
 * Image Optimization Utilities
 * -----------------------------
 * אופטימיזציה של תמונות
 */

/**
 * Lazy load images
 */
export function lazyLoadImage(imageUrl, placeholder = '/placeholder.png') {
  const img = new Image()
  
  img.src = placeholder
  img.dataset.src = imageUrl
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        observer.unobserve(img)
      }
    })
  })
  
  observer.observe(img)
  
  return img
}

/**
 * Compress image before upload
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        )
      }
      
      img.src = e.target.result
    }
    
    reader.readAsDataURL(file)
  })
}
