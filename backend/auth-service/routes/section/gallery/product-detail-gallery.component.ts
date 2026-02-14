// product-detail-gallery.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-gallery.component.html'
})
export class ProductDetailGalleryComponent {
  images = [
    'assets/cartzilla/img/shop/grocery/product/01.png',
    'assets/cartzilla/img/shop/grocery/product/02.png',
    'assets/cartzilla/img/shop/grocery/product/03.png'
  ];
  selectedImage = this.images[0];

  selectImage(image: string) {
    this.selectedImage = image;
  }
}