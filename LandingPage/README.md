# GoalsGuild Landing Page

A modern, responsive landing page for GoalsGuild with blog functionality, deployed on AWS S3 and CloudFront.

## 🚀 Features

- **Responsive Design**: Mobile-first approach with modern UI
- **Feature Carousel**: Showcase key features with smooth animations
- **Blog System**: Separate blog page with article management
- **Social Media Integration**: Links to LinkedIn, Twitter, Instagram, Facebook
- **Performance Optimized**: CloudFront CDN with optimized caching
- **Accessibility**: WCAG 2.1 AA compliant
- **SEO Ready**: Meta tags, structured data, and semantic HTML

## 📁 Project Structure

```
LandingPage/
├── terraform/              # Infrastructure as Code
│   ├── main.tf            # Main Terraform configuration
│   ├── s3.tf              # S3 bucket configuration
│   ├── cloudfront.tf      # CloudFront distribution
│   ├── variables.tf       # Input variables
│   ├── outputs.tf         # Output values
│   ├── backend.tf         # Backend configuration
│   └── environments/      # Environment-specific variables
│       ├── dev.tfvars
│       ├── staging.tfvars
│       └── prod.tfvars
├── scripts/               # Deployment scripts
│   ├── deploy.ps1         # PowerShell deployment script
│   ├── deploy.sh          # Bash deployment script
│   └── sync-to-s3.ps1     # Quick S3 sync script
├── src/                   # Source files
│   ├── index.html         # Landing page
│   ├── blog.html          # Blog page
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main styles
│   │   └── blog.css       # Blog-specific styles
│   ├── js/                # JavaScript files
│   │   ├── carousel.js    # Carousel functionality
│   │   ├── blog.js       # Blog functionality
│   │   └── main.js        # General functionality
│   ├── assets/            # Static assets
│   │   └── images/        # Images and logos
│   └── blog/              # Blog content
│       ├── articles/      # Blog article HTML files
│       └── manifest.json  # Article metadata
└── README.md              # This file
```

## 🛠 Prerequisites

- **AWS CLI**: Configured with appropriate permissions
- **Terraform**: Version 1.0 or higher
- **PowerShell**: For Windows deployment scripts
- **Bash**: For Unix/Linux deployment scripts

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd LandingPage
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 3. Deploy Infrastructure

#### PowerShell (Windows):
```powershell
.\scripts\deploy.ps1 -Environment dev
```

#### Bash (Unix/Linux):
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh -e dev
```

### 4. Access Your Website

After deployment, you'll get a CloudFront URL like:
```
https://d1234567890.cloudfront.net
```

## 📝 Environment Configuration

### Development
```bash
# Deploy to development
.\scripts\deploy.ps1 -Environment dev
```

### Staging
```bash
# Deploy to staging
.\scripts\deploy.ps1 -Environment staging
```

### Production
```bash
# Deploy to production
.\scripts\deploy.ps1 -Environment prod
```

## 🎨 Customization

### Brand Colors
Update CSS variables in `src/css/main.css`:
```css
:root {
    --primary-color: #1E5AA8;    /* Your primary color */
    --secondary-color: #FDB833;  /* Your secondary color */
}
```

### Content Updates
- **Landing Page**: Edit `src/index.html`
- **Blog Articles**: Add HTML files to `src/blog/articles/`
- **Styling**: Modify CSS files in `src/css/`

### Social Media Links
Update social media URLs in the footer section of both `index.html` and `blog.html`.

## 📰 Blog Management

### Adding New Articles

1. **Create HTML File**: Create a new HTML file in `src/blog/articles/` following the naming convention:
   ```
   YYYY-MM-DD-article-slug.html
   ```

2. **Article Template**:
   ```html
   <article class="blog-post">
     <header>
       <h1>Your Article Title</h1>
       <time datetime="2025-10-23">October 23, 2025</time>
       <div class="tags">Category</div>
     </header>
     <div class="content">
       <!-- Your article content here -->
     </div>
   </article>
   ```

3. **Update Manifest**: Add article metadata to `src/blog/manifest.json`:
   ```json
   {
     "id": "2025-10-23-your-article-slug",
     "title": "Your Article Title",
     "excerpt": "Brief description of the article...",
     "date": "2025-10-23",
     "category": "feature-announcement",
     "categoryLabel": "Feature Announcement",
     "url": "blog/articles/2025-10-23-your-article-slug.html"
   }
   ```

4. **Deploy**: Run the deployment script to upload the new article.

### Article Categories
- `feature-announcement`: New features and announcements
- `update`: Platform updates and improvements
- `guide`: How-to guides and tutorials
- `success-story`: User success stories
- `community`: Community highlights and events

## 🔧 Advanced Configuration

### Custom Domain
To use a custom domain:

1. **Update Terraform Variables**:
   ```hcl
   # In terraform/environments/prod.tfvars
   custom_domain = "your-domain.com"
   ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
   ```

2. **Deploy Infrastructure**:
   ```bash
   ./scripts/deploy.sh -e prod
   ```

3. **Configure DNS**: Point your domain to the CloudFront distribution.

### Geographic Restrictions
To restrict access by country:

```hcl
# In terraform/environments/prod.tfvars
geo_restrictions = ["US", "CA", "GB"]
geo_restriction_type = "whitelist"  # or "blacklist"
```

## 📊 Performance Optimization

### Caching Strategy
- **HTML Files**: 1 hour cache
- **CSS/JS Files**: 1 year cache
- **Images**: 1 year cache
- **CloudFront**: Global CDN with edge locations

### Image Optimization
- Use WebP format with PNG/JPEG fallbacks
- Optimize images before upload
- Use lazy loading for better performance

## 🔒 Security

### S3 Security
- Private bucket with no public access
- CloudFront Origin Access Control (OAC)
- Server-side encryption enabled

### CloudFront Security
- HTTPS only (redirects HTTP to HTTPS)
- Security headers via CloudFront
- Geographic restrictions (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Terraform State Lock**:
   ```bash
   terraform force-unlock <lock-id>
   ```

2. **S3 Sync Fails**:
   - Check AWS credentials
   - Verify bucket permissions
   - Ensure bucket exists

3. **CloudFront Not Updating**:
   - Wait 15 minutes for cache invalidation
   - Manually invalidate cache in AWS Console
   - Check if files were uploaded to S3

4. **Website Not Loading**:
   - Check CloudFront distribution status
   - Verify S3 bucket policy
   - Test S3 website URL directly

### Debug Commands

```bash
# Check Terraform state
terraform show

# List S3 bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test website accessibility
curl -I https://your-cloudfront-url
```

## 📈 Monitoring

### CloudWatch Metrics
- CloudFront requests and errors
- S3 storage and requests
- Cache hit ratio

### Performance Monitoring
- Use Google PageSpeed Insights
- Monitor Core Web Vitals
- Set up CloudWatch alarms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with basic landing page and blog
- **v1.1.0**: Added carousel functionality and improved mobile experience
- **v1.2.0**: Enhanced blog system with categories and search

### Upcoming Features
- [ ] Search functionality for blog
- [ ] Newsletter subscription
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Advanced caching strategies
