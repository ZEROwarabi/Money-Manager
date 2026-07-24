const fs = require('fs');
const imgPath = 'C:/Users/famil/Desktop/Money Manager/app/icon.jpg';
const svgPath = 'C:/Users/famil/Desktop/Money Manager/app/icon.svg';

try {
  const imgData = fs.readFileSync(imgPath);
  const base64Img = imgData.toString('base64');
  
  const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleView">
      <circle cx="256" cy="256" r="256" />
    </clipPath>
  </defs>
  <image width="512" height="512" href="data:image/jpeg;base64,${base64Img}" clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice" />
</svg>`;

  fs.writeFileSync(svgPath, svgContent);
  // delete the old icon.jpg so next.js uses icon.svg
  fs.unlinkSync(imgPath);
  console.log('Successfully created round icon.svg');
} catch (e) {
  console.error(e);
}
