import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Crown, 
  Check, 
  Zap, 
  FileText, 
  Users, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function PremiumPage() {
  const { profile } = useAuth();

  const features = [
    {
      icon: FileText,
      title: "Unlimited Preparations",
      description: "Create and store as many interview preparations as you need",
      free: "1 preparation only",
      premium: "Unlimited"
    },
    {
      icon: Zap,
      title: "Unlimited AI Booster",
      description: "Use our GPT-powered AI assistant on every step without limits",
      free: "1 booster only",
      premium: "Unlimited boosters"
    },
    {
      icon: FileText,
      title: "Clean PDF Reports",
      description: "Generate professional reports without watermarks",
      free: "Watermarked PDFs",
      premium: "Clean, professional PDFs"
    },
    {
      icon: Users,
      title: "Priority Support",
      description: "Get faster response times and dedicated assistance",
      free: "Community support",
      premium: "Priority email support"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer at Google",
      content: "The unlimited AI booster helped me prepare for multiple interviews simultaneously. Worth every penny!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Product Manager at Microsoft",
      content: "Clean PDF reports made all the difference in my interview presentations. Highly recommended!",
      rating: 5
    }
  ];

  if (profile?.is_premium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-full font-semibold text-lg mb-6">
              <Crown className="h-6 w-6" />
              <span>Premium Active</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              You're All Set! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Enjoy unlimited access to all premium features
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Premium Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{feature.premium}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <a
              href="/dashboard"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-full font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to Premium</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Unlock Your Full
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Potential</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get unlimited access to all features and accelerate your interview success
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-400">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6 text-center">
              <Crown className="h-12 w-12 text-white mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-white">Premium Plan</h2>
              <p className="text-yellow-100">Everything you need to succeed</p>
            </div>
            
            <div className="px-8 py-8">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">$9.90</div>
                <div className="text-gray-600">One-time payment</div>
                <div className="text-sm text-green-600 font-medium">Lifetime access</div>
              </div>

              <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 mb-6">
                Upgrade Now
              </button>

              <div className="text-center text-sm text-gray-500">
                Secure payment powered by Stripe
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="px-8 py-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Feature Comparison</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <feature.icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{feature.title}</div>
                          <div className="text-sm text-gray-600">{feature.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {feature.free}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">{feature.premium}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Our Premium Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is this a one-time payment?</h3>
              <p className="text-gray-600">Yes! Pay once and get lifetime access to all premium features.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Since it's a one-time payment, there's nothing to cancel. You keep access forever.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards through our secure Stripe integration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}