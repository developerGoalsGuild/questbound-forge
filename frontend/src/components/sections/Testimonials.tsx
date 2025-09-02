import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "TechCorp",
      content: "GoalGuild transformed how I approach personal development. The gamification elements made achieving my coding goals actually fun, and the community support was incredible.",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Marcus Rodriguez",
      role: "Fitness Coach",
      company: "Elite Training",
      content: "As a partner company, we've seen amazing engagement. Our clients love the medieval theme and the way it makes fitness goals feel like epic quests. Revenue increased by 40%.",
      rating: 5,
      avatar: "MR",
    },
    {
      name: "Dr. Emily Watson",
      role: "Patron & Philanthropist",
      company: "Watson Foundation",
      content: "Supporting the GoalGuild community has been incredibly rewarding. Seeing the direct impact of our patronage on people's lives and dreams is exactly what we hoped for.",
      rating: 5,
      avatar: "EW",
    },
  ];

  return (
    <section className="py-24 spacing-medieval bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            Tales of Triumph
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hear from adventurers, partners, and patrons who have found success in our guild.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="guild-card group relative overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="mb-6">
                  <Quote className="h-8 w-8 text-primary/30" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-secondary text-secondary"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-royal rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Decorative gradient border on hover */}
                <div className="absolute inset-0 bg-gradient-royal opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="medieval-banner p-8 max-w-2xl mx-auto">
            <h3 className="font-cinzel text-2xl font-bold mb-4 text-gradient-royal">
              Ready to Write Your Own Success Story?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of adventurers who are already achieving their dreams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-heraldic text-primary-foreground px-8 py-3 rounded-lg font-semibold">
                Begin Your Quest
              </button>
              <button className="btn-gold text-secondary-foreground px-8 py-3 rounded-lg font-semibold">
                Become a Partner
              </button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted by adventurers at</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="font-semibold text-lg">Microsoft</div>
            <div className="font-semibold text-lg">Google</div>
            <div className="font-semibold text-lg">Amazon</div>
            <div className="font-semibold text-lg">Meta</div>
            <div className="font-semibold text-lg">Netflix</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
